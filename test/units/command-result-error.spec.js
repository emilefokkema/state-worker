import { StateWorkerLifeCycle } from './state-worker-life-cycle';
import { FakeChildProcessFactory } from './fake-child-process-factory';

describe('when we create a state worker', () => {
    const commandMethodName = 'doThings';
    const config = {
        maxNumberOfProcesses: 3
    };
    const initializationResponse = {
        methodCollection: {queries: [], commands: [commandMethodName]}
    };
    let lifeCycle;
    let stateWorker;
    

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(new FakeChildProcessFactory('http://base.uri'));
        ({stateWorker} = await lifeCycle.createStateWorker(config, initializationResponse));
    });

    describe('and we execute a command and it fails', () => {
        const errorMessage = `very wrong`;
        let commandResultPromise;

        beforeAll(async () => {
            commandResultPromise = stateWorker[commandMethodName]();
            const {executionRequest} = await lifeCycle.getOrWaitForExecutionRequest();
            executionRequest.respond({error: errorMessage});
        });

        it('the request should fail', async () => {
            await expect(commandResultPromise).rejects.toThrow(errorMessage);
        });
    });
});