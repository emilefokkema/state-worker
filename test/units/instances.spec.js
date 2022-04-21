import { StateWorkerLifeCycle } from './state-worker-life-cycle';
import { FakeChildProcessFactory } from './fake-child-process-factory';

describe('when we create a state worker', () => {
    const queryMethodName = 'getThings';
    const baseURI = 'http://base.uri';
    const config = {
        maxNumberOfProcesses: 3
    };
    const initializationResponse = {
        methodCollection: {queries: [queryMethodName], commands: []}
    };
    let lifeCycle;
    let stateWorker;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(new FakeChildProcessFactory(baseURI));
        ({stateWorker} = await lifeCycle.createStateWorker(config, initializationResponse))
    });

    it('should be there', () => {
        expect(stateWorker).toBeTruthy();
    });

    describe('and then we make four requests (one more than the max number of processes)', () => {
        let request1ResultPromise, request2ResultPromise, request3ResultPromise, request4ResultPromise;
        let firstExecutionRequest;
        let firstExecutionRequestChildProcess;

        beforeAll(async () => {
            request1ResultPromise = stateWorker[queryMethodName](1);
            request2ResultPromise = stateWorker[queryMethodName](2);
            request3ResultPromise = stateWorker[queryMethodName](3);
            request4ResultPromise = stateWorker[queryMethodName](4);
            const {childProcess, executionRequest} = await lifeCycle.getOrWaitForExecutionRequest();
            firstExecutionRequest = executionRequest;
            firstExecutionRequestChildProcess = childProcess;
        });

        it('should have asked to execute the first request', () => {
            expect(firstExecutionRequest.content).toEqual({
                methodName: queryMethodName,
                args: [1],
                executionId: 0
            })
        });

        describe('and then the first instance responds to the first request', () => {
            const expectedRequest1Response = 'a';
            let actualRequest1Response;

            beforeAll(async () => {
                firstExecutionRequest.respond({result: expectedRequest1Response});
                actualRequest1Response = await request1ResultPromise;
            });

            it('no further instances should have been created yet', () => {
                expect(lifeCycle.getAllChildProcesses().length).toBe(0);
            });

            it('the first request should have resolved', () => {
                expect(actualRequest1Response).toEqual(expectedRequest1Response)
            });

            describe('and then the first instance returns its state', () => {
                const state = 42;
                let secondExecutionRequest;
                let secondExecutionRequestChildProcess;

                beforeAll(async () => {
                    const stateRequest = await firstExecutionRequestChildProcess.getStateRequest();
                    stateRequest.respond(state);
                    const {childProcess, executionRequest} = await lifeCycle.getOrWaitForExecutionRequest();
                    secondExecutionRequest = executionRequest;
                    secondExecutionRequestChildProcess = childProcess;
                });

                it('should have asked the first instance to execute the second request', () => {
                    expect(secondExecutionRequestChildProcess).toBe(firstExecutionRequestChildProcess);
                    expect(secondExecutionRequest.content).toEqual({
                        methodName: queryMethodName,
                        args: [2],
                        executionId: 1
                    })
                });

                describe('and we look for new child processes', () => {
                    let secondChildProcess, thirdChildProcess;

                    beforeAll(async () => {
                        [secondChildProcess, thirdChildProcess] = await lifeCycle.getOrWaitForNumberOfChildProcesses(2);
                    });

                    it('there should be two of them', () => {
                        expect(secondChildProcess).toBeTruthy();
                        expect(thirdChildProcess).toBeTruthy();
                    });

                    it('and no more', async () => {
                        await lifeCycle.whenNoChildProcessAdded(100);
                    });

                    describe('and then both new child processes send messages saying they have started', () => {
                        let secondInitializationRequest, thirdInitializationRequest;

                        beforeAll(async () => {
                            secondChildProcess.started.dispatch();
                            secondInitializationRequest = await secondChildProcess.getInitializationRequest();
                            thirdChildProcess.started.dispatch();
                            thirdInitializationRequest = await thirdChildProcess.getInitializationRequest();
                        });

                        it('there should be two new initialization requests', () => {
                            expect(secondInitializationRequest.content).toEqual({
                                config, baseURI, state
                            });
                            expect(thirdInitializationRequest.content).toEqual({
                                config, baseURI, state
                            });
                        });

                        describe('and then the second child process finishes initializing', () => {
                            let thirdExecutionRequest;
                            let thirdExecutionRequestChildProcess;

                            beforeAll(async () => {
                                secondInitializationRequest.respond(initializationResponse);
                                const {childProcess, executionRequest} = await lifeCycle.getOrWaitForExecutionRequest();
                                thirdExecutionRequest = executionRequest;
                                thirdExecutionRequestChildProcess = childProcess;
                            });

                            it('the second child process should have been asked to execute the third request', () => {
                                expect(thirdExecutionRequestChildProcess).toBe(secondChildProcess);
                                expect(thirdExecutionRequest.content).toEqual({
                                    methodName: queryMethodName,
                                    args: [3],
                                    executionId: 2
                                })
                            });

                            describe('and then the third child process finishes initializing', () => {
                                let fourthExecutionRequest;
                                let fourthExecutionRequestChildProcess;

                                beforeAll(async () => {
                                    thirdInitializationRequest.respond(initializationResponse);
                                    const {childProcess, executionRequest} = await lifeCycle.getOrWaitForExecutionRequest();
                                    fourthExecutionRequest = executionRequest;
                                    fourthExecutionRequestChildProcess = childProcess;
                                });

                                it('the third child process should have been asked to execute the fourth request', () => {
                                    expect(fourthExecutionRequestChildProcess).toBe(thirdChildProcess);
                                    expect(fourthExecutionRequest.content).toEqual({
                                        methodName: queryMethodName,
                                        args: [4],
                                        executionId: 3
                                    })
                                });

                                describe('and then when the three remaining executions requests get a response', () => {
                                    const expectedRequest2Response = 'b';
                                    const expectedRequest3Response = 'c';
                                    const expectedRequest4Response = 'd';

                                    beforeAll(() => {
                                        secondExecutionRequest.respond({result: expectedRequest2Response});
                                        thirdExecutionRequest.respond({result: expectedRequest3Response});
                                        fourthExecutionRequest.respond({result: expectedRequest4Response});
                                    });

                                    it('the three remaining requests should have resolved', async () => {
                                        expect(await Promise.all([
                                            request2ResultPromise,
                                            request3ResultPromise,
                                            request4ResultPromise
                                        ])).toEqual([
                                            expectedRequest2Response,
                                            expectedRequest3Response,
                                            expectedRequest4Response
                                        ])
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