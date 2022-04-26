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
        if(this.availableInstances.length === this.instances.length){
            this.availableInstances.splice(0, this.availableInstances.length);
            return;
        }
        const notYetIdleInstances = this.instances.filter(i => !this.availableInstances.includes(i));
        const idleInstancePromises = [];
        for(let notYetIdleInstance of notYetIdleInstances){
            idleInstancePromises.push(this.getSpecificIdleInstance(notYetIdleInstance, cancellationToken));
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
        const pendingInstanceCreation = new InstanceCreation();
        this.pendingInstanceCreations.push(pendingInstanceCreation);
        await this.addNewInstance(pendingInstanceCreation.cancellationToken);
        const index = this.pendingInstanceCreations.indexOf(pendingInstanceCreation);
        this.pendingInstanceCreations.splice(index, 1);
    }
    async getInstancesThatAreBeingCreated(cancellationToken){
        return Promise.all(this.pendingInstanceCreations.map(c => this.getIdleInstance(cancellationToken)))
    };
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
            await Promise.all([
                this.whenAllInstancesIdle(execution.cancellationToken),
                this.getInstancesThatAreBeingCreated(execution.cancellationToken)
            ]);
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
    async addNewInstance(cancellationToken){
        const instance = this.instanceFactory(this.latestInstanceId++);
        instance.onIdle.addListener(() => {
            this.releaseIdleInstance(instance);
        });
        await this.whenNoMoreCommandsPending();
        const methodCollection = await instance.initialize(this.state);
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
        return new ExecutionManager(instanceFactory, config.maxNumberOfProcesses);
    }
}