import { Execution } from './execution';
import { InstanceCreation } from './instance-creation';
import { Event } from './events/event';
import { getNext } from './events/get-next';
import { filter } from './events/filter';
import { executeAndThrowWhenCancelled } from './execute-and-throw-when-cancelled';
import { InstancePool } from './instance-pool';

export class ExecutionManager{
    constructor(instanceFactory, config, baseURI){
        this.instancePool = new InstancePool();

        this.instanceFactory = instanceFactory;
        this.baseURI = baseURI;
        this.maxNumberOfProcesses = config.maxNumberOfProcesses;
        this.gracefulQueryCancellation = config.gracefulQueryCancellation === undefined || !!config.gracefulQueryCancellation;
        this.config = config;
        this.pendingExecutions = [];  
        this.executionFinished = new Event();
        this.pendingInstanceCreations = [];
        
        this.latestInstanceId = 0;
        this.latestRequestId = 0;
        this.state = undefined;
    }
    terminate(){
        this.instancePool.terminate();
        const pendingInstanceCreations = this.pendingInstanceCreations.slice();
        for(let pendingInstanceCreation of pendingInstanceCreations){
            pendingInstanceCreation.cancellationToken.cancel();
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
    async whenExecutionHasFinished(execution, cancellationToken){
        if(!this.pendingExecutions.includes(execution)){
            return;
        }
        return await getNext(filter(this.executionFinished, (_execution) => _execution === execution), cancellationToken);
    }
    async whenNoMoreCommandsPending(cancellationToken){
        const commands = this.pendingExecutions.filter(e => e.isCommand);
        if(commands.length === 0){
            return;
        }
        await Promise.all(commands.map(c => this.whenExecutionHasFinished(c, cancellationToken)));
    }
    cancelAllQueries(){
        const queries = this.pendingExecutions.filter(e => !e.isCommand);
        for(let query of queries){
            query.cancellationToken.cancel();
        }
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
        const requestQueue = instance.enqueueIdleRequestQueue();
        const idleRequests = filter(instance.onIdleRequested, ({executionId}) => {
            return executionId === execution.id
        });
        const idleRequestsListener = async (_, sendResponse) => {
            if(execution.cancellationToken.cancelled){
                return;
            }
            await requestQueue.whenIdle(execution.cancellationToken);
            sendResponse();
        };
        idleRequests.addListener(idleRequestsListener);
        getNext(execution.cancellationToken).then(() => {
            idleRequests.removeListener(idleRequestsListener);
            instance.removeIdleRequestQueue(requestQueue);
        });
        const result = await instance.performExecution({
            methodName: execution.methodName,
            args: execution.args,
            id: execution.id});
        idleRequests.removeListener(idleRequestsListener);
        instance.removeIdleRequestQueue(requestQueue);
        return result;
    }
    async executeQuery(methodName, args){
        return await this.performExecution(methodName, args, false, async (execution) => {
            if(this.instancePool.idleCount() === 0 && this.instancePool.count() < this.maxNumberOfProcesses){
                this.createNewInstance();
            }
            const instance = await this.instancePool.getIdleInstance(execution.cancellationToken);
            if(execution.cancellationToken.cancelled){
                instance.setIdle();
                return;
            }
            const result = await this.performExecutionOnInstance(execution, instance);
            instance.setIdle();
            return result;
        });
    }
    async executeCommand(methodName, args){
        return await this.performExecution(methodName, args, true, async (execution) => {
            this.cancelAllQueries();
            if(!this.gracefulQueryCancellation){
                console.log(`getting at least one idle instance to execute ${execution}...`)
                const idleInstances = await this.instancePool.getAtLeastOneIdleInstance(execution.cancellationToken);
                return {};
            }
            const instances = await this.instancePool.whenAllInstancesIdle(execution.cancellationToken);
            const firstInstance = instances[0];
            firstInstance.allowIdle(false);
            const result = await this.performExecutionOnInstance(execution, firstInstance);
            firstInstance.allowIdle(true);
            this.state = result.state;
            const otherInstances = instances.filter(i => i !== firstInstance);
            await Promise.all(otherInstances.map(otherInstance => otherInstance.setState(result.state)))
            for(let idleInstance of instances){
                idleInstance.setIdle();
            }
            return result;
        });
    }
    async initializeInstance(instance, cancellationToken){
        if(cancellationToken){
            cancellationToken.addListener(() => {
                this.instancePool.terminateInstance(instance);
            });
        }
        await this.whenNoMoreCommandsPending(cancellationToken);
        await instance.whenStarted();
        const result = await instance.initialize(this.config, this.baseURI, this.state);
        if(result.error){
            this.instancePool.terminateInstance(instance);
			throw new Error(result.error);
		}
        if(!cancellationToken || !cancellationToken.cancelled){
            instance.setIdle();
        }
        return result.methodCollection;
    }
    async createNewInstance(){
        const pendingInstanceCreation = new InstanceCreation();
        this.pendingInstanceCreations.push(pendingInstanceCreation);
        const instance = this.instancePool.registerInstance(this.instanceFactory(this.latestInstanceId++));
        await this.initializeInstance(instance, pendingInstanceCreation.cancellationToken);
        const index = this.pendingInstanceCreations.indexOf(pendingInstanceCreation);
        this.pendingInstanceCreations.splice(index, 1);
    }
    initialize(){
        const instance = this.instancePool.registerInstance(this.instanceFactory(this.latestInstanceId++));
        return this.initializeInstance(instance);
    }
    static create(config, instanceFactory, baseURI){
        return new ExecutionManager(instanceFactory, config, baseURI);
    }
}