import { StateWorkerLifeCycle } from './state-worker-life-cycle';
import { FakeChildProcessFactory } from './fake-child-process-factory';

describe('when we create a state worker', () => {
    const queryMethodName = 'getThings';
    const baseURI = 'http://base.uri';
    const config = {
        maxNumberOfProcesses: 3
    };
    let lifeCycle;
    let stateWorker;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(new FakeChildProcessFactory(baseURI));
        ({stateWorker} = await lifeCycle.createStateWorker(config, {methodCollection: {queries: [queryMethodName], commands: []}}))
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
                isCommand: false
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
                        isCommand: false
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
                    });
                });
            });
        });
    });
});