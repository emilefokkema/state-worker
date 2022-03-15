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
    let firstChildProcess;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(new FakeChildProcessFactory(baseURI));
        ({stateWorker, childProcess: firstChildProcess} = await lifeCycle.createStateWorker(config, initializationResponse))
    });

    describe('and then we make four requests', () => {
        let request1ResultPromise, request2ResultPromise, request3ResultPromise, request4ResultPromise;

        beforeAll(() => {
            request1ResultPromise = stateWorker[queryMethodName](1);
            request2ResultPromise = stateWorker[queryMethodName](2);
            request3ResultPromise = stateWorker[queryMethodName](3);
            request4ResultPromise = stateWorker[queryMethodName](4);
        });

        describe('and then two more child processes are created and initialization requests are sent to them', () => {
            const expectedRequest1Response = 'a';
            let secondChildProcess, secondInitializationRequest, thirdChildProcess, thirdInitializationRequest;

            beforeAll(async () => {
                const {childProcess, executionRequest} = await lifeCycle.getOrWaitForExecutionRequest();
                executionRequest.respond({result: expectedRequest1Response});
                const stateRequest = await childProcess.getStateRequest();
                stateRequest.respond(42);
                [secondChildProcess, thirdChildProcess] = await lifeCycle.getOrWaitForNumberOfChildProcesses(2);
                secondChildProcess.started.dispatch();
                secondInitializationRequest = await secondChildProcess.getInitializationRequest();
                thirdChildProcess.started.dispatch();
                thirdInitializationRequest = await thirdChildProcess.getInitializationRequest();
            });

            it('they should be there', () => {
                expect(secondInitializationRequest).toBeTruthy();
                expect(thirdInitializationRequest).toBeTruthy();
            });

            describe('and then the first child process handles all pending requests in turn', () => {
                const expectedRequest2Response = 'b';
                const expectedRequest3Response = 'c';
                const expectedRequest4Response = 'd';

                beforeAll(async () => {
                    let { executionRequest } = await lifeCycle.getOrWaitForExecutionRequest();
                    executionRequest.respond({result: expectedRequest2Response});
                    ({executionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                    executionRequest.respond({result: expectedRequest3Response});
                    ({executionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                    executionRequest.respond({result: expectedRequest4Response});
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

                describe('and then the state worker is terminated', () => {

                    beforeAll(() => {
                        stateWorker.terminate();
                    });

                    it('the first child process should be terminated', async () => {
                        await firstChildProcess.whenTerminated();
                    })

                    describe('and then the second and third child processes finish initializing', () => {

                        beforeAll(() => {
                            secondInitializationRequest.respond(initializationResponse);
                            thirdInitializationRequest.respond(initializationResponse);
                        });

                        it('the second and third child processes should be terminated', async () => {
                            await secondChildProcess.whenTerminated();
                            await thirdChildProcess.whenTerminated();
                        });
                    });
                });
            });
        });
    });
});

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
    let firstChildProcess;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(new FakeChildProcessFactory(baseURI));
        ({stateWorker, childProcess: firstChildProcess} = await lifeCycle.createStateWorker(config, initializationResponse))
    });

    describe('and then we make four requests', () => {
        let request1ResultPromise, request2ResultPromise, request3ResultPromise, request4ResultPromise;

        beforeAll(() => {
            request1ResultPromise = stateWorker[queryMethodName](1);
            request2ResultPromise = stateWorker[queryMethodName](2);
            request3ResultPromise = stateWorker[queryMethodName](3);
            request4ResultPromise = stateWorker[queryMethodName](4);
        });

        describe('and then the first child process finishes handling the first request and is asked for its state', () => {
            let stateRequest;

            beforeAll(async () => {
                const {childProcess, executionRequest} = await lifeCycle.getOrWaitForExecutionRequest();
                executionRequest.respond({result: 5});
                stateRequest = await childProcess.getStateRequest();
            });

            describe('and then the state worker is terminated', () => {

                beforeAll(() => {
                    stateWorker.terminate();
                });

                describe('and then the first child process returns its state', () => {
                    
                    beforeAll(() => {
                        stateRequest.respond(42);
                    });

                    it('the three remaining requests should result in error', async () => {
                        await expect(request2ResultPromise).rejects.toThrow('state worker was terminated')
                        await expect(request3ResultPromise).rejects.toThrow('state worker was terminated')
                        await expect(request4ResultPromise).rejects.toThrow('state worker was terminated')
                    });

                    it('no further child processes should be created', async () => {
                        await lifeCycle.whenNoChildProcessAdded(100);
                    });
                });
            });
        });
    });
});