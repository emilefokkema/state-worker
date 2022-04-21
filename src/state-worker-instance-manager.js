import { Execution } from './execution';
import { InstanceCreation } from './instance-creation';
import { Event } from './events/event';
import { getNext } from './events/get-next';
import { filter } from './events/filter';
import { executeAndThrowWhenCancelled } from './execute-and-throw-when-cancelled';

export class StateWorkerInstanceManager{
    constructor(instanceFactory, maxNumberOfProcesses){
        this.instanceFactory = instanceFactory;
        this.maxNumberOfProcesses = maxNumberOfProcesses;
        this.instances = [];
        this.availableInstances = [];
        this.pendingExecutions = [];
        this.idleInstanceResponse = new Event();
        this.stateResponse = new Event();
        this.pendingInstanceCreations = [];
        this.pendingIdleInstanceRequests = [];
        this.stateRequested = false;
        this.latestInstanceId = 0;
        this.latestRequestId = 0;
    }
    terminate(){
        for(let instance of this.instances){
            instance.terminate();
        }
        const pendingInstanceCreations = this.pendingInstanceCreations.slice();
        for(let pendingInstanceCreation of pendingInstanceCreations){
            pendingInstanceCreation.cancel();
        }
        const pendingExecutions = this.pendingExecutions.splice(0, this.pendingExecutions.length);
        for(let pendingExecution of pendingExecutions){
            pendingExecution.cancellationToken.cancel();
        }
    }
    removePendingExecution(execution){
        const index = this.pendingExecutions.indexOf(execution);
        if(index === -1){
            return;
        }
        this.pendingExecutions.splice(index, 1);
    }
    removePendingIdleInstanceRequest(request){
        const index = this.pendingIdleInstanceRequests.indexOf(request);
        if(index === -1){
            return;
        }
        this.pendingIdleInstanceRequests.splice(index, 1);
    }
    async getState(){
        const responsePromise = getNext(this.stateResponse);
        if(!this.stateRequested){
            this.stateRequested = true;
            const instance = await this.getIdleInstance({createNew: false, priority: true});
            const state = await instance.getState();
            this.stateResponse.dispatch(state);
            this.stateRequested = false;
            this.releaseIdleInstance(instance);
        }
        const [state] = await responsePromise;
        return state;
    }
    async getIdleInstance({createNew, priority, specificInstance, executionId}){
        const index = this.availableInstances.findIndex(i => !specificInstance || i === specificInstance);
        if(index > -1){
            const [instance] = this.availableInstances.splice(index, 1);
            return instance;
        }
        
        const idleInstanceRequest = {specificInstance, executionId};
        const responsePromise = getNext(filter(this.idleInstanceResponse, (_request) => _request === idleInstanceRequest));
        if(priority){
            this.pendingIdleInstanceRequests.unshift(idleInstanceRequest);
        }else{
            this.pendingIdleInstanceRequests.push(idleInstanceRequest);
        }
        
        if(createNew && this.instances.length + this.pendingInstanceCreations.length < this.maxNumberOfProcesses){
            this.createNewInstance();
        }
        const [, instance] = await responsePromise;
        return instance;
    }
    async whenAllInstancesIdle(){
        if(this.availableInstances.length === this.instances.length){
            this.availableInstances.splice(0, this.availableInstances.length);
            return;
        }
        const pendingIdleInstanceRequests = this.pendingIdleInstanceRequests.map(r => {const {specificInstance, ...rest} = r;return rest;})
        console.log('pending idle instance requests:', pendingIdleInstanceRequests)
        console.log('pending executions:', this.pendingExecutions.map(e => e.toString()))
        await new Promise(res => {})
    }
    releaseIdleInstance(instance){
        let index = this.pendingIdleInstanceRequests.findIndex(r => r.specificInstance === instance);
        if(index === -1){
            index = this.pendingIdleInstanceRequests.findIndex(r => !r.specificInstance);
        }
        if(index > -1){
            const [request] = this.pendingIdleInstanceRequests.splice(index, 1);
            this.idleInstanceResponse.dispatch(request, instance);
            return;
        }
        this.availableInstances.push(instance);
    }
    async createNewInstance(){
        const pendingInstanceCreation = new InstanceCreation();
        this.pendingInstanceCreations.push(pendingInstanceCreation);
        const state = await this.getState();
        if(pendingInstanceCreation.cancelled){
            return;
        }
        await this.addNewInstance(state, pendingInstanceCreation.cancellationToken);
        const index = this.pendingInstanceCreations.indexOf(pendingInstanceCreation);
        this.pendingInstanceCreations.splice(index, 1);
    }
   
    async executeQuery(methodName, args){
        const execution = new Execution(this.latestRequestId++, methodName, args, false);
        this.pendingExecutions.push(execution);
        let result;
        try{
            result = await executeAndThrowWhenCancelled(async () => {
                const instance = await this.getIdleInstance({createNew: true, priority: false, executionId: execution.id});
                if(execution.cancellationToken.cancelled){
                    this.releaseIdleInstance(instance);
                    return;
                }
                const result = await instance.performExecution({methodName, args, executionId: execution.id});
                this.releaseIdleInstance(instance);
                this.removePendingExecution(execution);
                return result;
            }, execution.cancellationToken);
        }catch(e){
            throw new Error('execution was cancelled');
        }
        if(result.error){
            throw new Error(result.error);
        }
        return result.result;
    }
    async executeCommand(methodName, args){
        const execution = new Execution(this.latestRequestId++, methodName, args, true);
        this.pendingExecutions.push(execution);
        let result;
        try{
            result = await executeAndThrowWhenCancelled(async () => {
                console.log(`before executing ${execution}, waiting for all instances to be idle...`)
                await this.whenAllInstancesIdle();
                console.log(`all instances are idle. Now going to execute ${execution}`)
                const instance = this.instances[0];
                const result = await instance.performExecution({methodName, args, executionId: execution.id});
                this.removePendingExecution(execution);
                for(let idleInstance of this.instances){
                    this.releaseIdleInstance(idleInstance);
                }
                return result;
            }, execution.cancellationToken);
        }catch(e){
            throw new Error('execution was cancelled');
        }
        if(result.error){
            throw new Error(result.error);
        }
        return result.result;
    }
    async addNewInstance(state, cancellationToken){
        const instance = this.instanceFactory(this.latestInstanceId++);
        instance.onIdle.addListener(() => {
            this.releaseIdleInstance(instance);
        });
        instance.onIdleRequested.addListener(async ({executionId}, sendResponse) => {
            await this.getIdleInstance({specificInstance: instance, executionId});
            sendResponse();
        });
        const methodCollection = await instance.initialize(state);
        if(cancellationToken && cancellationToken.cancelled){
            instance.terminate();
            return;
        }
        this.instances.push(instance);
        this.releaseIdleInstance(instance);
        return methodCollection;
    }
    initialize(){
        return this.addNewInstance();
    }
    static create(instanceFactory, config){
        return new StateWorkerInstanceManager(instanceFactory, config.maxNumberOfProcesses);
    }
}