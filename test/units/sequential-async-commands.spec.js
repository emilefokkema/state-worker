import { StateWorkerLifeCycle } from './state-worker-life-cycle';
import { FakeChildProcessFactory } from './fake-child-process-factory';

describe('when we create a state worker', () => {
    const commandMethodName = 'doThingsAsync';
    const baseUri = 'http://base.uri';
    const config = {
        maxNumberOfProcesses: 1
    };
    const initializationResponse = {
        methodCollection: {queries: [], commands: [commandMethodName]}
    };
    let lifeCycle;
    let stateWorker;
    let childProcess;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(new FakeChildProcessFactory(baseUri));
        ({stateWorker, childProcess} = await lifeCycle.createStateWorker(config, initializationResponse));
    });

    describe('and we give it two commands to execute', () => {
        let firstExecutionRequest;

        beforeAll(async () => {
            stateWorker[commandMethodName](1);
            stateWorker[commandMethodName](2);
            ({executionRequest: firstExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
        });

        it('should have begun to execute the first command', () => {
            expect(firstExecutionRequest.content).toEqual({
                methodName: commandMethodName,
                args: [1],
                id: 0
            });
        });

        describe('and then the child process becomes idle and wants to resume immediately afterwards', () => {
            let idlePromise;

            beforeAll(() => {
                childProcess.onIdle.dispatch();
                idlePromise = childProcess.requestIdle(0);
            });

            it('should be allowed to resume immediately', async () => {
                await idlePromise;
            });

            describe('and then the first command returns', () => {
                let secondExecutionRequest;

                beforeAll(async () => {
                    firstExecutionRequest.respond({state: 8});
                    ({executionRequest: secondExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                });

                it('should have begun to execute the second command', () => {
                    expect(secondExecutionRequest.content).toEqual({
                        methodName: commandMethodName,
                        args: [2],
                        id: 1
                    });
                });
            });
        });
    });
});