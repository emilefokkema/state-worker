import { Execution } from './execution';

export class StateWorkerInstanceManager{
    constructor(instanceFactory, maxNumberOfProcesses){
        this.instanceFactory = instanceFactory;
        this.maxNumberOfProcesses = maxNumberOfProcesses;
        this.instances = [];
        this.pendingExecutions = [];
        this.executionResultListeners = [];
    }
    terminate(){
        for(let instance of this.instances){
            instance.terminate();
        }
    }
    notifyExecutionResultListeners(execution, result, error){
        const listenersToNotify = this.executionResultListeners.slice();
        for(let listenerToNotify of listenersToNotify){
            listenerToNotify(execution, result, error);
        }
    }
    removeExecutionResultListener(listener){
        const index = this.executionResultListeners.indexOf(listener);
        if(index === -1){
            return;
        }
        this.executionResultListeners.splice(index, 1);
    }
    async performExecution(execution, instance){
        try{
            const result = await instance.performExecution(execution);
            this.notifyExecutionResultListeners(execution, result, undefined);
        }catch(e){
            this.notifyExecutionResultListeners(execution, undefined, e);
        }
    }
    async next(){
        if(this.pendingExecutions.length === 0){
            console.log('queue is empty')
            return;
        }
        const instanceThatIsNotBusy = this.instances.find(i => !i.busy);
        if(!instanceThatIsNotBusy){
            console.log('all instances are busy')
            return;
        }
        const execution = this.pendingExecutions.shift();
        console.log(`going to execute '${execution.methodName}'`)
        await this.performExecution(execution, instanceThatIsNotBusy);
        this.next();
    }
    getExecutionResult(execution){
        return new Promise((res, rej) => {
            const listener = (_execution, result, error) => {
                if(_execution !== execution){
                    return;
                }
                this.removeExecutionResultListener(listener);
                if(error){
                    rej(error);
                    return;
                }
                res(result);
            };
            this.executionResultListeners.push(listener);
        });
    }
    executeQuery(methodName, args){
        const execution = new Execution(methodName, args, false);
        const promise = this.getExecutionResult(execution);
        console.log(`queueing execution of query '${methodName}'`)
        this.pendingExecutions.push(execution);
        this.next();
        return promise;
    }
    executeCommand(methodName, args){
        const execution = new Execution(methodName, args, true);
        const promise = this.getExecutionResult(execution);
        console.log(`queueing execution of command '${methodName}'`)
        this.pendingExecutions.push(execution);
        this.next();
        return promise;
    }
    async initialize(){
        const instance = this.instanceFactory();
        const methodCollection = await instance.initialize();
        this.instances.push(instance);
        return methodCollection;
    }
    static create(instanceFactory, config){
        return new StateWorkerInstanceManager(instanceFactory, config.maxNumberOfProcesses);
    }
}