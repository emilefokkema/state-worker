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
    async cancelAllQueries(){
        const queries = this.pendingExecutions.filter(e => !e.isCommand);
        if(queries.length === 0){
            return;
        }
        const queriesFinishedPromises = queries.map(q => this.whenExecutionHasFinished(q));
        for(let query of queries){
            query.cancellationToken.cancel();
        }
        await Promise.all(queriesFinishedPromises);
    }
    removePendingIdleInstanceRequest(request){
        const index = this.pendingIdleInstanceRequests.indexOf(request);
        if(index === -1){
            return;
        }
        this.pendingIdleInstanceRequests.splice(index, 1);
    }
    async getIdleInstance({createNew, specificInstance, executionId}, cancellationToken){
        const index = this.availableInstances.findIndex(i => !specificInstance || i === specificInstance);
        if(index > -1){
            const [instance] = this.availableInstances.splice(index, 1);
            return instance;
        }
        
        const idleInstanceRequest = {specificInstance, executionId};
        const responsePromise = getNext(filter(this.idleInstanceResponse, (_request) => _request === idleInstanceRequest));
        this.pendingIdleInstanceRequests.push(idleInstanceRequest);
        
        if(createNew && this.instances.length + this.pendingInstanceCreations.length < this.maxNumberOfProcesses){
            this.createNewInstance();
        }
        let instance;
        const whenCancelled = getNext(cancellationToken);
        await Promise.race([
            whenCancelled,
            (async () => {
                [, instance] = await responsePromise;
            })()
        ]);
        if(!instance && cancellationToken.cancelled){
            const index = this.pendingIdleInstanceRequests.indexOf(idleInstanceRequest);
            if(index > -1){
                this.pendingIdleInstanceRequests.splice(index, 1);
            }
            return;
        }
        return instance;
    }
    async whenAllInstancesIdle(){
        if(this.availableInstances.length === this.instances.length){
            this.availableInstances.splice(0, this.availableInstances.length);
            return;
        }
        const pendingIdleInstanceRequests = this.pendingIdleInstanceRequests.map(r => {const {specificInstance, ...rest} = r;return {specificInstance: !!specificInstance, ...rest};})
        //console.log(`${this.availableInstances.length} idle instance(s)`)
        //console.log('pending idle instance requests:', pendingIdleInstanceRequests)
        //console.log('pending executions:', this.pendingExecutions.map(e => e.toString()))
        //console.log(`${this.pendingInstanceCreations.length} instance creation(s) pending`)
        
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
            throw new Error('execution was cancelled');
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
            await this.getIdleInstance({specificInstance: instance, executionId: execution.id}, execution.cancellationToken);
            sendResponse();
        };
        idleRequests.addListener(idleRequestsListener);
        const result = await instance.performExecution({
            methodName: execution.methodName,
            args: execution.args,
            id: execution.id});
        idleRequests.removeListener(idleRequestsListener);
        return result;
    }
    async executeQuery(methodName, args){
        return await this.performExecution(methodName, args, false, async (execution) => {
            await this.whenNoMoreCommandsPending();
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
            //console.log(`before executing ${execution}, waiting for all instances to be idle...`)
            await this.cancelAllQueries();
            await this.whenAllInstancesIdle();
            //console.log(`all instances are idle. Now going to execute ${execution}`)
            const instance = this.instances[0];
            const result = await this.performExecutionOnInstance(execution, instance);
            this.state = result.state;
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