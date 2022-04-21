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

    describe('and we ask to execute a command', () => {
        let firstCommandResultPromise;
        let firstCommandExecutionRequest;

        beforeAll(async () => {
            firstCommandResultPromise = stateWorker[commandMethodName](1);
            ({executionRequest: firstCommandExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
        });

        it('one execution request should have been sent to a child process', () => {
            expect(firstCommandExecutionRequest.content).toEqual({
                methodName: commandMethodName,
                args: [1],
                executionId: 0
            });
        });

        describe('and then we ask to execute another command', () => {
            let secondCommandResultPromise;

            beforeAll(() => {
                secondCommandResultPromise = stateWorker[commandMethodName](2);
            });

            describe('and then the first command finishes executing and the state worker is terminated', () => {

                beforeAll(async () => {
                    firstCommandExecutionRequest.respond({result: 0});
                    await firstCommandResultPromise;
                    stateWorker.terminate();
                });

                it('the second command execution should fail', async () => {
                    await expect(secondCommandResultPromise).rejects.toThrow('execution was cancelled');
                });
            });
        });
    });
});