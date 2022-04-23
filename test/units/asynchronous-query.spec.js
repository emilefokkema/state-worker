import { StateWorkerLifeCycle } from './state-worker-life-cycle';
import { FakeChildProcessFactory } from './fake-child-process-factory';

describe('when we create a state worker', () => {
    const queryMethodName = 'getThingsAsync';
    const baseUri = 'http://base.uri';
    const config = {
        maxNumberOfProcesses: 2
    };
    const initializationResponse = {
        methodCollection: {queries: [queryMethodName], commands: []}
    };
    let lifeCycle;
    let stateWorker;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(new FakeChildProcessFactory(baseUri));
        ({stateWorker} = await lifeCycle.createStateWorker(config, initializationResponse));
    });

    describe('and then we make a request', () => {
        let firstRequestResultPromise;
        let firstRequestChildProcess;
        let firstExecutionRequest;

        beforeAll(async () => {
            firstRequestResultPromise = stateWorker[queryMethodName](1);
            ({childProcess: firstRequestChildProcess, executionRequest: firstExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
        });

        it('a request should have been made', () => {
            expect(firstExecutionRequest.content).toEqual({
                methodName: queryMethodName,
                args: [1],
                id: 0
            });
        });

        describe('and then we make a second request and a second child process is started', () => {
            let secondRequestResultPromise;
            let secondChildProcess;
            let secondChildProcessInitializationRequest;

            beforeAll(async () => {
                secondRequestResultPromise = stateWorker[queryMethodName](2);
                secondChildProcess = await lifeCycle.getOrWaitForChildProcess();
                secondChildProcess.started.dispatch();
                secondChildProcessInitializationRequest = await secondChildProcess.getInitializationRequest();
            });

            it('an initialization request should have been sent to the second child process', () => {
                expect(secondChildProcessInitializationRequest.content).toEqual({
                    baseURI: baseUri,
                    config
                });
            });

            describe('and then the second child process finishes initializing', () => {
                let secondExecutionRequest;
                let secondExecutionRequestChildProcess;

                beforeAll(async () => {
                    secondChildProcessInitializationRequest.respond(initializationResponse);
                    ({childProcess: secondExecutionRequestChildProcess, executionRequest: secondExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                });

                it('the second child process should have been asked to execute the second request', () => {
                    expect(secondExecutionRequestChildProcess).toBe(secondChildProcess);
                    expect(secondExecutionRequest.content).toEqual({
                        methodName: queryMethodName,
                        args: [2],
                        id: 1
                    });
                });

                describe('and then the execution of the first request begins to wait and then resumes', () => {

                    beforeAll(async () => {
                        firstRequestChildProcess.onIdle.dispatch();
                        await firstRequestChildProcess.requestIdle(0);
                    });

                    describe('and then we make a third request', () => {
                        let thirdRequestResultPromise;

                        beforeAll(() => {
                            thirdRequestResultPromise = stateWorker[queryMethodName](3);
                        });

                        describe('and now the execution of the second request begins to wait', () => {
                            let thirdExecutionRequest;
                            let thirdExecutionRequestChildProcess;

                            beforeAll(async () => {
                                secondChildProcess.onIdle.dispatch();
                                ({childProcess: thirdExecutionRequestChildProcess, executionRequest: thirdExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                            });

                            it('the second child process should have been asked to execute the third request', () => {
                                expect(thirdExecutionRequestChildProcess).toBe(secondChildProcess);
                                expect(thirdExecutionRequest.content).toEqual({
                                    methodName: queryMethodName,
                                    args: [3],
                                    id: 2
                                });
                            });

                            describe('and now the execution of the second request wants to resume', () => {
                                let secondProcessIdlePromise;

                                beforeAll(() => {
                                    secondProcessIdlePromise = secondChildProcess.requestIdle(1);
                                });

                                describe('and now we make a fourth request', () => {
                                    let fourthRequestResultPromise;

                                    beforeAll(() => {
                                        fourthRequestResultPromise = stateWorker[queryMethodName](4);
                                    });

                                    describe('and now the execution of the first request completes', () => {
                                        const firstExecutionResult = 100;
                                        let fourthExecutionRequest;
                                        let fourthExecutionRequestChildProcess;

                                        beforeAll(async () => {
                                            firstExecutionRequest.respond({result: firstExecutionResult});
                                            ({childProcess: fourthExecutionRequestChildProcess, executionRequest: fourthExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                                        });

                                        it('the first request should have completed', async () => {
                                            expect(await firstRequestResultPromise).toEqual(firstExecutionResult);
                                        });

                                        it('the first child process should have been asked to execute the fourth request', () => {
                                            expect(fourthExecutionRequestChildProcess).toBe(firstRequestChildProcess);
                                            expect(fourthExecutionRequest.content).toEqual({
                                                methodName: queryMethodName,
                                                args: [4],
                                                id: 3
                                            });
                                        });

                                        describe('and now we make a fifth request', () => {
                                            let fifthRequestResultPromise;

                                            beforeAll(() => {
                                                fifthRequestResultPromise = stateWorker[queryMethodName](5);
                                            });

                                            describe('and now the execution of the third request begins to wait', () => {

                                                beforeAll(() => {
                                                    secondChildProcess.onIdle.dispatch();
                                                });

                                                it('the second child process should be allowed to resume', async () => {
                                                    await secondProcessIdlePromise;
                                                });

                                                describe('and now the execution of the third request wants to resume', () => {
                                                    let secondProcessIdleAgainPromise;

                                                    beforeAll(() => {
                                                        secondProcessIdleAgainPromise = secondChildProcess.requestIdle(2);
                                                    });

                                                    describe('and now the execution of the second request completes', () => {
                                                        const secondExecutionResult = 101;

                                                        beforeAll(() => {
                                                            secondExecutionRequest.respond({result: secondExecutionResult});
                                                        });

                                                        it('the second request should have completed', async () => {
                                                            expect(await secondRequestResultPromise).toEqual(secondExecutionResult);
                                                        });

                                                        it('the second child process should be allowed to resume', async () => {
                                                            await secondProcessIdleAgainPromise;
                                                        });

                                                        describe('and now execution of the fourth request begins to wait', () => {
                                                            let fifthExecutionRequest;
                                                            let fifthExecutionRequestChildProcess;

                                                            beforeAll(async () => {
                                                                firstRequestChildProcess.onIdle.dispatch();
                                                                ({childProcess: fifthExecutionRequestChildProcess, executionRequest: fifthExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                                                            });

                                                            it('the first child process should have been asked to execute the fifth request', () => {
                                                                expect(fifthExecutionRequestChildProcess).toBe(firstRequestChildProcess);
                                                                expect(fifthExecutionRequest.content).toEqual({
                                                                    methodName: queryMethodName,
                                                                    args: [5],
                                                                    id: 4
                                                                });
                                                            });

                                                            it('should wrap up', async () => {
                                                                const thirdExecutionResult = 102;
                                                                thirdExecutionRequest.respond({result: thirdExecutionResult});
                                                                expect(await thirdRequestResultPromise).toEqual(thirdExecutionResult);
                                                                let firstProcessIdleAgainPromise = firstRequestChildProcess.requestIdle(3);
                                                                firstRequestChildProcess.onIdle.dispatch();
                                                                await firstProcessIdleAgainPromise;
                                                                const fourthExecutionResult = 103;
                                                                fourthExecutionRequest.respond({result: fourthExecutionResult});
                                                                expect(await fourthRequestResultPromise).toEqual(fourthExecutionResult);
                                                                await firstRequestChildProcess.requestIdle(4);
                                                                const fifthExecutionResult = 104;
                                                                fifthExecutionRequest.respond({result: fifthExecutionResult});
                                                                expect(await fifthRequestResultPromise).toEqual(fifthExecutionResult);
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});