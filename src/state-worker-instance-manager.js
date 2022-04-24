import { Execution } from './execution';
import { InstanceCreation } from './instance-creation';
import { Event } from './events/event';
import { getNext } from './events/get-next';
import { filter } from './events/filter';
import { executeAndThrowWhenCancelled } from './execute-and-throw-when-cancelled';
import { IdleInstanceRequest } from './idle-instance-request';

export class StateWorkerInstanceManager{
    constructor(instanceFactory, maxNumberOfProcesses){
        this.instanceFactory = instanceFactory;
        this.maxNumberOfProcesses = maxNumberOfProcesses;
        this.instances = [];
        this.availableInstances = [];
        this.pendingExecutions = [];
        this.idleInstanceResponse = new Event();
        this.executionFinished = new Event();
        this.pendingInstanceCreations = [];
        this.pendingIdleInstanceRequests = [];
        this.latestInstanceId = 0;
        this.latestRequestId = 0;
        this.state = undefined;
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
    finishExecution(execution){
        const index = this.pendingExecutions.indexOf(execution);
        if(index === -1){
            return;
        }
        this.pendingExecutions.splice(index, 1);
        this.executionFinished.dispatch(execution);
    }
    async whenExecutionHasFinished(execution){
        if(!this.pendingExecutions.includes(execution)){
            return;
        }
        return await getNext(filter(this.executionFinished, (_execution) => _execution === execution));
    }
    async whenNoMoreCommandsPending(){
        const commands = this.pendingExecutions.filter(e => e.isCommand);
        if(commands.length === 0){
            return;
        }
        await Promise.all(commands.map(c => this.whenExecutionHasFinished(c)));
    }
    async getIdleInstance({createNew, specificInstance, executionId}, cancellationToken){
        const index = this.availableInstances.findIndex(i => !specificInstance || i === specificInstance);
        if(index > -1){
            const [instance] = this.availableInstances.splice(index, 1);
            return instance;
        }
        
        const idleInstanceRequest = new IdleInstanceRequest(specificInstance, executionId);
        const responsePromise = getNext(filter(this.idleInstanceResponse, (_request) => _request === idleInstanceRequest));
        this.pendingIdleInstanceRequests.push(idleInstanceRequest);
        if(createNew && this.instances.length + this.pendingInstanceCreations.length < this.maxNumberOfProcesses){
            this.createNewInstance();
        }
        let instance;
        getNext(cancellationToken).then(() => {
            const index = this.pendingIdleInstanceRequests.indexOf(idleInstanceRequest);
            if(index > -1){
                this.pendingIdleInstanceRequests.splice(index, 1);
            }
        });
        [, instance] = await responsePromise;
        return instance;
    }
    async whenAllInstancesIdle(cancellationToken){
        if(this.availableInstances.length === this.instances.length){
            this.availableInstances.splice(0, this.availableInstances.length);
            return;
        }
        const queries = this.pendingExecutions.filter(e => !e.isCommand);
        const notYetIdleInstances = this.instances.filter(i => !this.availableInstances.includes(i));
        const idleInstancePromises = [];
        for(let notYetIdleInstance of notYetIdleInstances){
            idleInstancePromises.push(this.getIdleInstance({specificInstance: notYetIdleInstance}, cancellationToken));
        }
        idleInstancePromises.push(...this.pendingInstanceCreations.map(c => this.getIdleInstance({}, cancellationToken)));
        for(let query of queries){
            query.cancellationToken.cancel();
        }
        await Promise.all(idleInstancePromises);
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
        await this.whenNoMoreCommandsPending();
        await this.addNewInstance(this.state, pendingInstanceCreation.cancellationToken);
        const index = this.pendingInstanceCreations.indexOf(pendingInstanceCreation);
        this.pendingInstanceCreations.splice(index, 1);
    }
    async performExecution(methodName, args, isCommand, fn){
        const execution = new Execution(this.latestRequestId++, methodName, args, isCommand);
        this.pendingExecutions.push(execution);
        let result;
        try{
            result = await executeAndThrowWhenCancelled(() => fn(execution), execution.cancellationToken);
        }catch(e){
            throw new Error(`execution was cancelled`);
        }finally{
            this.finishExecution(execution);
        }
        if(result.error){
            throw new Error(result.error);
        }
        return result.result;
    }
    async performExecutionOnInstance(execution, instance){
        const idleRequests = filter(instance.onIdleRequested, ({executionId}) => {
            return executionId === execution.id
        });
        const idleRequestsListener = async (_, sendResponse) => {
            if(execution.cancellationToken.cancelled){
                return;
            }
            await this.getIdleInstance({specificInstance: instance, executionId: execution.id}, execution.cancellationToken);
            sendResponse();
        };
        idleRequests.addListener(idleRequestsListener);
        getNext(execution.cancellationToken).then(() => idleRequests.removeListener(idleRequestsListener));
        const result = await instance.performExecution({
            methodName: execution.methodName,
            args: execution.args,
            id: execution.id});
        idleRequests.removeListener(idleRequestsListener);
        return result;
    }
    async executeQuery(methodName, args){
        return await this.performExecution(methodName, args, false, async (execution) => {
            const instance = await this.getIdleInstance({createNew: true, executionId: execution.id}, execution.cancellationToken);
            if(execution.cancellationToken.cancelled){
                this.releaseIdleInstance(instance);
                return;
            }
            const result = await this.performExecutionOnInstance(execution, instance);
            this.releaseIdleInstance(instance);
            return result;
        });
    }
    async executeCommand(methodName, args){
        return await this.performExecution(methodName, args, true, async (execution) => {
            console.log(`before executing ${execution}, waiting for all instances to be idle...`)
            await this.whenAllInstancesIdle(execution.cancellationToken);
            console.log(`all ${this.instances.length} instances are idle. Now going to execute ${execution}`)
            const firstInstance = this.instances[0];
            const result = await this.performExecutionOnInstance(execution, firstInstance);
            this.state = result.state;
            const otherInstances = this.instances.filter(i => i !== firstInstance);
            await Promise.all(otherInstances.map(otherInstance => otherInstance.setState(result.state)))
            for(let idleInstance of this.instances){
                this.releaseIdleInstance(idleInstance);
            }
            return result;
        });
    }
    async addNewInstance(state, cancellationToken){
        const instance = this.instanceFactory(this.latestInstanceId++);
        instance.onIdle.addListener(() => {
            this.releaseIdleInstance(instance);
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