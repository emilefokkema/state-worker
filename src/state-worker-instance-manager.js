class Execution{
    constructor(methodName, args, isCommand){
        this.methodName = methodName;
        this.args = args;
        this.isCommand = isCommand;
    }
}

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
    removeExecutionResultListener(listener){
        const index = this.executionResultListeners.indexOf(listener);
        if(index === -1){
            return;
        }
        this.executionResultListeners.splice(index, 1);
    }
    performExecution(execution, instance){
        
    }
    next(){
        if(this.pendingExecutions.length === 0){
            return;
        }
        const instanceThatIsNotBusy = this.instances.find(i => !i.busy);
        if(!instanceThatIsNotBusy){
            return;
        }
        const execution = this.pendingExecutions.shift();
        this.performExecution(execution, instanceThatIsNotBusy);
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
        this.pendingExecutions.push(execution);
        this.next();
        return promise;
    }
    executeCommand(methodName, args){
        const execution = new Execution(methodName, args, true);
        const promise = this.getExecutionResult(execution);
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