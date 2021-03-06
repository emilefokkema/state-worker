import { StateWorkerLifeCycle } from './state-worker-life-cycle';
import { FakeChildProcessFactory } from './fake-child-process-factory';

describe('when we create a state worker', () => {
    const queryMethodName = 'getThings';
    const asyncQueryMethodName = 'getThingsAsync';
    const commandMethodName = 'doThings';
    const baseUri = 'http://base.uri';
    const config = {
        maxNumberOfProcesses: 3,
        gracefulQueryCancellation: true
    };
    const initializationResponse = {
        methodCollection: {queries: [queryMethodName, asyncQueryMethodName], commands: [commandMethodName]}
    };
    let lifeCycle;
    let stateWorker;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(new FakeChildProcessFactory(baseUri));
        ({stateWorker} = await lifeCycle.createStateWorker(config, initializationResponse));
    });

    describe('and we begin executing five queries, resulting in three active child processes', () => {
        let firstExecutionRequestChildProcess;
        let secondQueryResultPromise;
        let secondExecutionRequestChildProcess;
        let secondExecutionRequest;
        let thirdQueryResultPromise;
        let secondChildProcess;
        let thirdChildProcess;
        let thirdExecutionRequestChildProcess;
        let thirdExecutionRequest;
        let fourthQueryResultPromise;
        let fourthExecutionRequest;
        let fourthExecutionRequestChildProcess;
        let fifthQueryResultPromise;

        beforeAll(async () => {
            let firstExecutionRequest;
            stateWorker[queryMethodName](1);
            secondQueryResultPromise = stateWorker[asyncQueryMethodName](2);
            thirdQueryResultPromise = stateWorker[queryMethodName](3);
            fourthQueryResultPromise = stateWorker[queryMethodName](4);
            fifthQueryResultPromise = stateWorker[queryMethodName](5);
            ({childProcess: firstExecutionRequestChildProcess, executionRequest: firstExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
            firstExecutionRequest.respond({result: 9});
            ({childProcess: secondExecutionRequestChildProcess, executionRequest: secondExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
            [secondChildProcess, thirdChildProcess] = await lifeCycle.getOrWaitForNumberOfChildProcesses(2);
            secondChildProcess.started.dispatch();
            const initializationRequest = await secondChildProcess.getInitializationRequest();
            initializationRequest.respond(initializationResponse);
            ({childProcess: thirdExecutionRequestChildProcess, executionRequest: thirdExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
            firstExecutionRequestChildProcess.onIdle.dispatch();
            ({childProcess: fourthExecutionRequestChildProcess, executionRequest: fourthExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
            firstExecutionRequestChildProcess.requestIdle(1);
        });

        it('the right requests should have been sent to the right processes', () => {
            expect(secondExecutionRequest.content).toEqual({
                methodName: asyncQueryMethodName,
                args: [2],
                id: 1
            });
            expect(thirdExecutionRequest.content).toEqual({
                methodName: queryMethodName,
                args: [3],
                id: 2
            });
            expect(fourthExecutionRequest.content).toEqual({
                methodName: queryMethodName,
                args: [4],
                id: 3
            });
            expect(firstExecutionRequestChildProcess).toBe(secondExecutionRequestChildProcess);
            expect(firstExecutionRequestChildProcess).toBe(fourthExecutionRequestChildProcess);
            expect(firstExecutionRequestChildProcess).not.toBe(thirdExecutionRequestChildProcess);
            expect(thirdExecutionRequestChildProcess).toBe(secondChildProcess);
            expect(thirdChildProcess).toBeTruthy();
            expect(thirdChildProcess).not.toBe(firstExecutionRequestChildProcess);
            expect(thirdChildProcess).not.toBe(secondChildProcess);
        });

        describe('and then two commands and a query are added', () => {

            beforeAll(() => {
                stateWorker[commandMethodName]('a');
                stateWorker[commandMethodName]('b');
                stateWorker[queryMethodName](6);
            });

            it('the four remaining previous queries should all have rejected', async () => {
                await expect(secondQueryResultPromise).rejects.toThrow('execution was cancelled')
                await expect(thirdQueryResultPromise).rejects.toThrow('execution was cancelled');
                await expect(fourthQueryResultPromise).rejects.toThrow('execution was cancelled');
                await expect(fifthQueryResultPromise).rejects.toThrow('execution was cancelled');
            });

            describe('and then the third and fourth execution request return and the third child process finishes intializing', () => {
                let firstCommandExecutionRequest;
                let firstCommandChildProcess;

                beforeAll(async () => {
                    thirdExecutionRequest.respond('a');
                    fourthExecutionRequest.respond('b');
                    thirdChildProcess.started.dispatch();
                    const initializationRequest = await thirdChildProcess.getInitializationRequest();
                    initializationRequest.respond(initializationResponse);
                    ({childProcess: firstCommandChildProcess, executionRequest: firstCommandExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                });

                it('should have asked the first child process to execute the first command', () => {
                    expect(firstCommandExecutionRequest.content).toEqual({
                        methodName: commandMethodName,
                        args: ['a'],
                        id: 5
                    })
                    expect(firstCommandChildProcess).toBe(firstExecutionRequestChildProcess);
                });

                describe('and then the command returns', () => {
                    const firstState = 100;
                    let secondChildProcessSetStateRequest;
                    let thirdChildProcessSetStateRequest;

                    beforeAll(async () => {
                        firstCommandExecutionRequest.respond({state: firstState});
                        secondChildProcessSetStateRequest = await secondChildProcess.getSetStateRequest();
                        thirdChildProcessSetStateRequest = await thirdChildProcess.getSetStateRequest();
                    });

                    it('should have asked the second and third child processes to set the new state', () => {
                        expect(secondChildProcessSetStateRequest.content).toEqual(firstState);
                        expect(thirdChildProcessSetStateRequest.content).toEqual(firstState);
                    });

                    describe('and then the second and third child processes finish setting the state', () => {
                        let secondCommandExecutionRequest;
                        let secondCommandChildProcess;

                        beforeAll(async () => {
                            secondChildProcessSetStateRequest.respond();
                            thirdChildProcessSetStateRequest.respond();
                            ({childProcess: secondCommandChildProcess, executionRequest: secondCommandExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                        });

                        it('should have asked the first child process to execute the second command', () => {
                            expect(secondCommandExecutionRequest.content).toEqual({
                                methodName: commandMethodName,
                                args: ['b'],
                                id: 6
                            })
                            expect(secondCommandChildProcess).toBe(firstExecutionRequestChildProcess);
                        });

                        describe('and then the second command returns', () => {
                            const secondState = 101;
                            let secondChildProcessSetSecondStateRequest;
                            let thirdChildProcessSetSecondStateRequest;

                            beforeAll(async () => {
                                secondCommandExecutionRequest.respond({state: secondState});
                                secondChildProcessSetSecondStateRequest = await secondChildProcess.getSetStateRequest();
                                thirdChildProcessSetSecondStateRequest = await thirdChildProcess.getSetStateRequest();
                            });

                            it('should have asked the second and third child processes to set another new state', () => {
                                expect(secondChildProcessSetSecondStateRequest.content).toEqual(secondState);
                                expect(thirdChildProcessSetSecondStateRequest.content).toEqual(secondState);
                            });

                            describe('and then the second and third child processes finish setting the state again', () => {
                                let lastQueryExecutionRequest;

                                beforeAll(async () => {
                                    secondChildProcessSetSecondStateRequest.respond();
                                    thirdChildProcessSetSecondStateRequest.respond();
                                    ({executionRequest: lastQueryExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                                });

                                it('execution of the last query should have been requested', () => {
                                    expect(lastQueryExecutionRequest.content).toEqual({
                                        methodName: queryMethodName,
                                        args: [6],
                                        id: 7
                                    })
                                    expect(secondCommandChildProcess).toBe(firstExecutionRequestChildProcess);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});