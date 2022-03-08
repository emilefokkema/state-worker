import { Execution } from './execution';

class InstanceCreation{
    constructor(){
        this.started = false;
        this.cancelled = false;
    }
    canStart(){
        return !this.started && !this.cancelled;
    }
    canFinish(){
        return !this.cancelled;
    }
    start(){
        this.started = true;
    }
}
export class StateWorkerInstanceManager{
    constructor(instanceFactory, maxNumberOfProcesses){
        this.instanceFactory = instanceFactory;
        this.maxNumberOfProcesses = maxNumberOfProcesses;
        this.instances = [];
        this.idleInstances = [];
        this.pendingExecutions = [];
        this.executionResultListeners = [];
        this.pendingInstanceCreations = [];
        this.latestInstanceId = 0;
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
    async performNewInstanceCreation(instanceCreation, state){
        if(!instanceCreation.canStart()){
            return;
        }
        instanceCreation.start();
        const instance = this.instanceFactory(this.latestInstanceId++);
        await instance.initialize(state);
        if(!instanceCreation.canFinish()){
            instance.terminate();
            return;
        }
        const index = this.pendingInstanceCreations.indexOf(instanceCreation);
        this.pendingInstanceCreations.splice(index, 1);
        this.idleInstances.push(instance);
        this.instances.push(instance);
    }
    async createNewInstancesUsingInstance(instance){
        const pendingInstanceCreationsThatCanStart = this.pendingInstanceCreations.filter(c => c.canStart());
        if(pendingInstanceCreationsThatCanStart.length > 0){
            const state = await instance.getState();
            await Promise.all(pendingInstanceCreationsThatCanStart.map(c => this.performNewInstanceCreation(c, state)));
        }
    }
    async performExecution(execution, instance){
        const result = await instance.performExecution(execution);
        if(result.error){
            this.notifyExecutionResultListeners(execution, undefined, result.error);
        }else{
            this.notifyExecutionResultListeners(execution, result.result, undefined);
        }
        await this.createNewInstancesUsingInstance(instance);
        this.idleInstances.push(instance);
        this.next();
    }
    async next(){
        if(this.pendingExecutions.length === 0){
            return;
        }
        const maxNumberOfNewInstances = this.maxNumberOfProcesses - this.instances.length - this.pendingInstanceCreations.length;
        const neededNumberOfNewInstances = Math.max(0, this.pendingExecutions.length - this.idleInstances.length);
        const numberOfNewInstancesToCreate = Math.min(maxNumberOfNewInstances, neededNumberOfNewInstances);
        const numberOfExecutions = Math.min(this.idleInstances.length, this.pendingExecutions.length);
        const instances = this.idleInstances.splice(0, numberOfExecutions);
        for(let i = 0; i < numberOfNewInstancesToCreate; i++){
            this.pendingInstanceCreations.push(new InstanceCreation());
        }
        for(let i = 0; i < numberOfExecutions; i++){
            const execution = this.pendingExecutions.shift();
            const instance = instances[i];
            this.performExecution(execution, instance);
        }
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
        const instance = this.instanceFactory(this.latestInstanceId++);
        const methodCollection = await instance.initialize();
        this.idleInstances.push(instance);
        this.instances.push(instance);
        return methodCollection;
    }
    static create(instanceFactory, config){
        return new StateWorkerInstanceManager(instanceFactory, config.maxNumberOfProcesses);
    }
}