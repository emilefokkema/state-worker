import { createStateWorkerFactory } from '../../src/state-worker-factory-factory';
import { NotifyingList } from './notifying-list';

export class StateWorkerLifeCycle{
    constructor(fakeChildProcessFactory){
        this.fakeChildProcessFactory = fakeChildProcessFactory;
        this.childProcesses = new NotifyingList();
        this.stateWorkers = new NotifyingList();
        this.executionRequests = new NotifyingList();

        fakeChildProcessFactory.childProcessCreated.addListener((childProcess) => {
            this.childProcesses.add(childProcess);
            childProcess.execution.requestAdded.addListener((executionRequest) => {
                this.executionRequests.add({childProcess, executionRequest})
            });
        });
    }
    getOrWaitForStateWorker(){
        return this.stateWorkers.getOrWaitForItem();
    }
    getOrWaitForChildProcess(){
        return this.childProcesses.getOrWaitForItem();
    }
    getOrWaitForExecutionRequest(){
        return this.executionRequests.getOrWaitForItem();
    }
    whenNoChildProcessAdded(timeout){
        return this.childProcesses.whenNoneAdded(timeout);
    }
    getOrWaitForNumberOfChildProcesses(number){
        return this.childProcesses.getOrWaitForNumberOfItems(number);
    }
    getAllChildProcesses(){
        return this.childProcesses.getAll();
    }
    async begin(config){
        const stateWorker = await (createStateWorkerFactory(() => this.fakeChildProcessFactory, p => p))(config);
        this.stateWorkers.add(stateWorker);
    }
    async createStateWorker(config, initializationResponse){
        this.begin(config);
        const childProcess = await this.getOrWaitForChildProcess();
        childProcess.started.dispatch();
        const initializationRequest = await childProcess.getInitializationRequest();
        initializationRequest.respond(initializationResponse);
        return {stateWorker: await this.getOrWaitForStateWorker(), childProcess};
    }
}