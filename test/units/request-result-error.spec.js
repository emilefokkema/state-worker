import { StateWorkerLifeCycle } from './state-worker-life-cycle';
import { FakeChildProcessFactory } from './fake-child-process-factory';

describe('when we create a state worker', () => {
    const queryMethodName = 'getThings';
    const config = {
        maxNumberOfProcesses: 3
    };
    const initializationResponse = {
        methodCollection: {queries: [queryMethodName], commands: []}
    };
    let lifeCycle;
    let stateWorker;
    

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(new FakeChildProcessFactory('http://base.uri'));
        ({stateWorker} = await lifeCycle.createStateWorker(config, initializationResponse));
    });

    describe('and we make a request and the request fails', () => {
        const errorMessage = `very wrong`;
        let requestResultPromise;

        beforeAll(async () => {
            requestResultPromise = stateWorker[queryMethodName]();
            const {executionRequest} = await lifeCycle.getOrWaitForExecutionRequest();
            executionRequest.respond({error: errorMessage});
        });

        it('the request should fail', async () => {
            await expect(requestResultPromise).rejects.toThrow(errorMessage);
        });
    });
});