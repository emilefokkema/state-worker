import { StateWorkerLifeCycle } from './state-worker-life-cycle';
import { FakeChildProcessFactory } from './fake-child-process-factory';

describe('when we create a state worker', () => {
    const asyncQueryMethodName = 'getThingsAsync';
    const baseUri = 'http://base.uri';
    const config = {
        maxNumberOfProcesses: 1
    };
    const initializationResponse = {
        methodCollection: {queries: [asyncQueryMethodName], commands: []}
    };
    let lifeCycle;
    let stateWorker;
    let childProcess;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(new FakeChildProcessFactory(baseUri));
        ({stateWorker, childProcess} = await lifeCycle.createStateWorker(config, initializationResponse));
    });

    describe('and we add four queries', () => {
        let firstExecutionRequest;

        beforeAll(async () => {
            stateWorker[asyncQueryMethodName](1);
            stateWorker[asyncQueryMethodName](2);
            stateWorker[asyncQueryMethodName](3);
            stateWorker[asyncQueryMethodName](4);
            ({executionRequest: firstExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
        });

        it('execution of the first query should have started', () => {
            expect(firstExecutionRequest.content).toEqual({
                methodName: asyncQueryMethodName,
                args: [1],
                id: 0
            });
        });

        describe('and then the process becomes idle', () => {
            let secondExecutionRequest;

            beforeAll(async () => {
                childProcess.onIdle.dispatch();
                ({executionRequest: secondExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
            });

            it('execution of the second query should have started', () => {
                expect(secondExecutionRequest.content).toEqual({
                    methodName: asyncQueryMethodName,
                    args: [2],
                    id: 1
                });
            });

            describe('and then it becomes idle again', () => {
                let thirdExecutionRequest;

                beforeAll(async () => {
                    childProcess.onIdle.dispatch();
                    ({executionRequest: thirdExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                });

                it('execution of the third query should have started', () => {
                    expect(thirdExecutionRequest.content).toEqual({
                        methodName: asyncQueryMethodName,
                        args: [3],
                        id: 2
                    });
                });

                describe('and then it becomes idle again', () => {
                    let fourthExecutionRequest;

                    beforeAll(async () => {
                        childProcess.onIdle.dispatch();
                        ({executionRequest: fourthExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                    });

                    it('execution of the fourth query should have started', () => {
                        expect(fourthExecutionRequest.content).toEqual({
                            methodName: asyncQueryMethodName,
                            args: [4],
                            id: 3
                        });
                    });

                    describe('and then the third, first and second queries would like to resume', () => {
                        let thirdQueryResumePromise;
                        let firstQueryResumePromise;
                        let secondQueryResumePromise;

                        beforeAll(() => {
                            thirdQueryResumePromise = childProcess.requestIdle(2);
                            firstQueryResumePromise = childProcess.requestIdle(0);
                            secondQueryResumePromise = childProcess.requestIdle(1);
                        });

                        describe('and then the process becomes idle', () => {

                            beforeAll(() => {
                                childProcess.onIdle.dispatch();
                            });

                            it('execution of the first query should be allowed to resume', async () => {
                                await firstQueryResumePromise;
                            });
                        });
                    });
                });
            });
        });
    });
});