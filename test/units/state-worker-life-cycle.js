import { createStateWorkerFactory } from '../../src/state-worker-factory-factory';
import { FakeChildProcessFactory } from './fake-child-process-factory';
import { getNext } from '../../src/events/get-next';

export class StateWorkerLifeCycle{
    constructor(baseURI){
        this.childProcessFactory = new FakeChildProcessFactory(baseURI);
        this.creationPromise = undefined;
        this.firstInitializationRequestPromise = undefined;
    }
    getNumberOfChildProcesses(){
        return this.childProcessFactory.childProcesses.length;
    }
    async finishCreation(firstInitializationResult){
        const [firstInitializationRequest] = await this.firstInitializationRequestPromise;
        firstInitializationRequest.respond(firstInitializationResult);
        return await this.creationPromise;
    }
    async start(config){
        const firstChildProcessPromise = getNext(this.childProcessFactory.childProcessCreated);
        this.creationPromise = (createStateWorkerFactory(() => this.childProcessFactory, p => p))(config);
        const [firstChildProcess] = await firstChildProcessPromise;
        this.firstInitializationRequestPromise = getNext(firstChildProcess.initializationRequest);
        return firstChildProcess;
    }
}