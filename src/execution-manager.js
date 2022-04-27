import { Execution } from './execution';
import { InstanceCreation } from './instance-creation';
import { Event } from './events/event';
import { getNext } from './events/get-next';
import { filter } from './events/filter';
import { executeAndThrowWhenCancelled } from './execute-and-throw-when-cancelled';
import { IdleInstanceRequest } from './idle-instance-request';

export class ExecutionManager{
    constructor(instanceFactory, maxNumberOfProcesses){
        this.instances = [];
        this.availableInstances = [];
        this.pendingIdleInstanceRequests = [];
        this.idleInstanceResponse = new Event();

        this.instanceFactory = instanceFactory;
        this.maxNumberOfProcesses = maxNumberOfProcesses;
        this.pendingExecutions = [];  
        this.executionFinished = new Event();
        this.pendingInstanceCreations = [];
        
        this.latestInstanceId = 0;
        this.latestRequestId = 0;
        this.state = undefined;
    }
    terminateAllInstances(){
        for(let instance of this.instances){
            instance.terminate();
        }
    }
    instanceIsAvailable(){
        return this.availableInstances.length > 0;
    }
    async getSpecificIdleInstance(instance, cancellationToken){
        const index = this.availableInstances.indexOf(instance);
        if(index > -1){
            this.availableInstances.splice(index, 1);
            return;
        }
        
        const idleInstanceRequest = new IdleInstanceRequest(instance);
        const responsePromise = getNext(filter(this.idleInstanceResponse, (_request) => _request === idleInstanceRequest));
        this.pendingIdleInstanceRequests.push(idleInstanceRequest);
        getNext(cancellationToken).then(() => {
            const index = this.pendingIdleInstanceRequests.indexOf(idleInstanceRequest);
            if(index > -1){
                this.pendingIdleInstanceRequests.splice(index, 1);
            }
        });
        await responsePromise;
    }
    async getIdleInstance(cancellationToken){
        if(this.availableInstances.length > 0){
            const [instance] = this.availableInstances.splice(0, 1);
            return instance;
        }
        
        const idleInstanceRequest = new IdleInstanceRequest();
        const responsePromise = getNext(filter(this.idleInstanceResponse, (_request) => _request === idleInstanceRequest));
        this.pendingIdleInstanceRequests.push(idleInstanceRequest);
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
        const result = this.instances.slice();
        await Promise.all(result.map(i => this.getSpecificIdleInstance(i, cancellationToken)));
        return result;
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
    terminate(){
        this.terminateAllInstances();
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
    cancelAllQueries(){
        const queries = this.pendingExecutions.filter(e => !e.isCommand);
        for(let query of queries){
            query.cancellationToken.cancel();
        }
    }
    async createNewInstance(){
        const instance = this.instanceFactory(this.latestInstanceId++);
        const pendingInstanceCreation = new InstanceCreation(instance);
        this.pendingInstanceCreations.push(pendingInstanceCreation);
        instance.onIdle.addListener(() => {
            this.releaseIdleInstance(instance);
        });
        await this.whenNoMoreCommandsPending();
        await instance.initialize(this.state);
        if(pendingInstanceCreation.cancellationToken.cancelled){
            instance.terminate();
        }else{
            this.instances.push(instance);
            this.releaseIdleInstance(instance);
        }
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
            await this.getSpecificIdleInstance(instance, execution.cancellationToken);
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
            if(!this.instanceIsAvailable() && this.instances.length + this.pendingInstanceCreations.length < this.maxNumberOfProcesses){
                this.createNewInstance();
            }
            const instance = await this.getIdleInstance(execution.cancellationToken);
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
            this.cancelAllQueries();
            const initializedInstances = this.pendingInstanceCreations.map(c => c.instance);
            const [existingInstances] = await Promise.all([
                this.whenAllInstancesIdle(execution.cancellationToken),
                initializedInstances.map(i => this.getSpecificIdleInstance(i, execution.cancellationToken))
            ]);
            const instances = existingInstances.concat(initializedInstances);
            const firstInstance = instances[0];
            const result = await this.performExecutionOnInstance(execution, firstInstance);
            this.state = result.state;
            const otherInstances = instances.filter(i => i !== firstInstance);
            await Promise.all(otherInstances.map(otherInstance => otherInstance.setState(result.state)))
            for(let idleInstance of instances){
                this.releaseIdleInstance(idleInstance);
            }
            return result;
        });
    }
    async addNewInstance(){
        const instance = this.instanceFactory(this.latestInstanceId++);
        instance.onIdle.addListener(() => {
            this.releaseIdleInstance(instance);
        });
        const methodCollection = await instance.initialize();
        this.instances.push(instance);
        this.releaseIdleInstance(instance);
        return methodCollection;
    }
    initialize(){
        return this.addNewInstance();
    }
    static create(instanceFactory, config){
        return new ExecutionManager(instanceFactory, config.maxNumberOfProcesses);
    }
}