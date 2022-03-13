import { createStateWorkerFactory } from '../../src/state-worker-factory-factory';
import { FakeChildProcessFactory } from './fake-child-process-factory';
import { getNext } from '../../src/events/get-next';

export class StateWorkerLifeCycle{
    constructor(baseURI, config){
        this.config = config;
        this.childProcessFactory = new FakeChildProcessFactory(baseURI);
        this.creationPromise = undefined;
        this.firstChildProcess = undefined;
        this.firstInitializationRequest = undefined;
        this.stateWorker = undefined;
    }
    getNumberOfChildProcesses(){
        return this.childProcessFactory.childProcesses.length;
    }
    async finishCreation(firstInitializationResult){
        if(!this.firstInitializationRequest){
            await this.notifyFirstChildProcessStarted();
        }
        this.firstInitializationRequest.respond(firstInitializationResult);
        this.stateWorker = await this.creationPromise;
    }
    async notifyFirstChildProcessStarted(){
        if(!this.firstChildProcess){
            await this.start();
        }
        this.firstInitializationRequest = await this.firstChildProcess.notifyStarted();
    }
    async start(){
        const firstChildProcessPromise = getNext(this.childProcessFactory.childProcessCreated);
        this.creationPromise = (createStateWorkerFactory(() => this.childProcessFactory, p => p))(this.config);
        const [firstChildProcess] = await firstChildProcessPromise;
        this.firstChildProcess = firstChildProcess;
    }
}