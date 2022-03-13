import { createStateWorkerFactory } from '../../src/state-worker-factory-factory';
import { FakeChildProcessFactory } from './fake-child-process-factory';
import { getNext } from '../../src/events/get-next';

export class StateWorkerLifeCycle{
    constructor(baseURI){
        this.childProcessFactory = new FakeChildProcessFactory(baseURI);
        this.creationPromise = undefined;
    }
    getNumberOfChildProcesses(){
        return this.childProcessFactory.childProcesses.length;
    }
    async finishCreation(firstInitializationRequest, firstInitializationResult){
        firstInitializationRequest.respond(firstInitializationResult);
        return await this.creationPromise;
    }
    async start(config){
        const firstChildProcessPromise = getNext(this.childProcessFactory.childProcessCreated);
        this.creationPromise = (createStateWorkerFactory(() => this.childProcessFactory, p => p))(config);
        const [firstChildProcess] = await firstChildProcessPromise;
        return firstChildProcess;
    }
}