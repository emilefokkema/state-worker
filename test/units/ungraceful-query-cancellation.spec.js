import { StateWorkerLifeCycle } from './state-worker-life-cycle';
import { FakeChildProcessFactory } from './fake-child-process-factory';

xdescribe('when we create a state worker', () => {
    const queryMethodName = 'getThings';
    const asyncQueryMethodName = 'getThingsAsync';
    const commandMethodName = 'doThings';
    const baseUri = 'http://base.uri';
    const config = {
        maxNumberOfProcesses: 3,
        gracefulQueryCancellation: false
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

        describe('and then two commands and two queries are added', () => {

            beforeAll(() => {
                stateWorker[commandMethodName]('a');
                stateWorker[commandMethodName]('b');
                stateWorker[queryMethodName](6);
                stateWorker[queryMethodName](7);
            });

            it('the four remaining previous queries should all have rejected', async () => {
                await expect(secondQueryResultPromise).rejects.toThrow('execution was cancelled')
                await expect(thirdQueryResultPromise).rejects.toThrow('execution was cancelled');
                await expect(fourthQueryResultPromise).rejects.toThrow('execution was cancelled');
                await expect(fifthQueryResultPromise).rejects.toThrow('execution was cancelled');
            });

            describe('and then the first child process becomes idle', () => {
                let firstCommandExecutionRequest;

                beforeAll(async () => {
                    firstExecutionRequestChildProcess.onIdle.dispatch();
                    ({executionRequest: firstCommandExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                });

                it('the other two child processes should have been terminated', async () => {
                    await secondChildProcess.whenTerminated();
                    await thirdChildProcess.whenTerminated();
                });

                it('execution of the first command should have started', () => {
                    expect(firstCommandExecutionRequest.content).toEqual({
                        methodName: commandMethodName,
                        args: ['a'],
                        id: 5
                    });
                });

                describe('and then the command returns', () => {
                    let secondCommandExecutionRequest;

                    beforeAll(async () => {
                        firstCommandExecutionRequest.respond({state: 8});
                        ({executionRequest: secondCommandExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                    });

                    it('execution of the second command should have started', () => {
                        expect(secondCommandExecutionRequest.content).toEqual({
                            methodName: commandMethodName,
                            args: ['b'],
                            id: 6
                        });
                    });

                    describe('and then the second command returns', () => {
                        const finalStateAfterCommands = 9;
                        let firstQueryAfterCommandExecutionRequest;
                        let firstNewChildProcessAfterCommands;
                        let firstInitializationRequestAfterCommands;

                        beforeAll(async () => {
                            secondCommandExecutionRequest.respond({state: finalStateAfterCommands});
                            ({executionRequest: firstQueryAfterCommandExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                            firstNewChildProcessAfterCommands = await lifeCycle.getOrWaitForChildProcess();
                            firstNewChildProcessAfterCommands.started.dispatch();
                            firstInitializationRequestAfterCommands = await firstNewChildProcessAfterCommands.getInitializationRequest();
                        });

                        it('a new child process should have been created', () => {
                            expect(firstNewChildProcessAfterCommands).toBeTruthy();
                            expect(firstNewChildProcessAfterCommands).not.toBe(firstExecutionRequestChildProcess);
                            expect(firstNewChildProcessAfterCommands).not.toBe(secondChildProcess);
                            expect(firstNewChildProcessAfterCommands).not.toBe(thirdChildProcess);
                        });

                        it('execution of the first query after the commands should have started', () => {
                            expect(firstQueryAfterCommandExecutionRequest.content).toEqual({
                                methodName: queryMethodName,
                                args: [6],
                                id: 7
                            });
                        });

                        it('a new child process should have begun to initialize', () => {
                            expect(firstInitializationRequestAfterCommands.content).toEqual({
                                config, 
                                baseURI: baseUri,
                                state: finalStateAfterCommands
                            })
                        });

                        describe('and then the new child process finishes initializing', () => {
                            let lastQueryExecutionRequest;

                            beforeAll(async () => {
                                firstInitializationRequestAfterCommands.respond(initializationResponse);
                                ({executionRequest: lastQueryExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                            });

                            it('execution of the last query should have started', () => {
                                expect(lastQueryExecutionRequest.content).toEqual({
                                    methodName: queryMethodName,
                                    args: [7],
                                    id: 8
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

describe('when we create a state worker', () => {
    const queryMethodName = 'getThings';
    const commandMethodName = 'doThings';
    const baseUri = 'http://base.uri';
    const config = {
        maxNumberOfProcesses: 3,
        gracefulQueryCancellation: false
    };
    const initializationResponse = {
        methodCollection: {queries: [queryMethodName], commands: [commandMethodName]}
    };
    let lifeCycle;
    let stateWorker;
    let firstChildProcess;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(new FakeChildProcessFactory(baseUri));
        ({stateWorker, childProcess: firstChildProcess} = await lifeCycle.createStateWorker(config, initializationResponse));
    });

    describe('and we make requests so that three instances are busy', () => {
        let firstQueryResultPromise;
        let secondQueryResultPromise;
        let thirdQueryResultPromise;
        let firstQueryExecutionRequest;
        let secondQueryExecutionRequest;
        let thirdQueryExecutionRequest;
        let secondChildProcess;
        let thirdChildProcess;

        beforeAll(async () => {
            firstQueryResultPromise = stateWorker[queryMethodName](1);
            secondQueryResultPromise = stateWorker[queryMethodName](2);
            thirdQueryResultPromise = stateWorker[queryMethodName](3);
            ({executionRequest: firstQueryExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
            [secondChildProcess, thirdChildProcess] = await lifeCycle.getOrWaitForNumberOfChildProcesses(2);
            secondChildProcess.started.dispatch();
            thirdChildProcess.started.dispatch();
            const [secondInitializationRequest, thirdInitializationRequest] = await Promise.all([
                secondChildProcess.getInitializationRequest(),
                thirdChildProcess.getInitializationRequest()
            ]);
            secondInitializationRequest.respond(initializationResponse);
            ({executionRequest: secondQueryExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
            thirdInitializationRequest.respond(initializationResponse);
            ({executionRequest: thirdQueryExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
        });

        it('three execution requests should have been made', () => {
            expect(firstQueryExecutionRequest.content).toEqual({
                methodName: queryMethodName,
                args: [1],
                id: 0
            });
            expect(secondQueryExecutionRequest.content).toEqual({
                methodName: queryMethodName,
                args: [2],
                id: 1
            });
            expect(thirdQueryExecutionRequest.content).toEqual({
                methodName: queryMethodName,
                args: [3],
                id: 2
            });
        });

        describe('and then the first two queries resolve, so that one instance is still busy', () => {

            beforeAll(async () => {
                firstQueryExecutionRequest.respond({result: 0});
                await firstQueryResultPromise;
                secondQueryExecutionRequest.respond({result: 1});
                await secondQueryResultPromise;
            });

            describe('and then we add two commands and three more queries', () => {
                let firstCommandExecutionRequest;
                let firstCommandChildProcess;

                beforeAll(async () => {
                    stateWorker[commandMethodName]('a');
                    stateWorker[commandMethodName]('b');
                    stateWorker[queryMethodName](4);
                    stateWorker[queryMethodName](5);
                    stateWorker[queryMethodName](6);
                    ({executionRequest: firstCommandExecutionRequest, childProcess: firstCommandChildProcess} = await lifeCycle.getOrWaitForExecutionRequest());
                });

                it('the third query should have rejected', async () => {
                    await expect(thirdQueryResultPromise).rejects.toThrow('execution was cancelled');
                });

                it('the third child process should have been terminated', async () => {
                    await thirdChildProcess.whenTerminated();
                });

                it('execution of the first command should have started on the first instance', () => {
                    expect(firstCommandExecutionRequest.content).toEqual({
                        methodName: commandMethodName,
                        args: ['a'],
                        id: 3
                    });
                    expect(firstCommandChildProcess).toBe(firstChildProcess);
                });

                describe('and then the first command returns', () => {
                    const stateAfterFirstCommand = 3;
                    let setStateRequest;

                    beforeAll(async () => {
                        firstCommandExecutionRequest.respond({state: stateAfterFirstCommand});
                        setStateRequest = await secondChildProcess.getSetStateRequest();
                    });

                    it('the second child process should have been asked to set its state', () => {
                        expect(setStateRequest.content).toEqual(stateAfterFirstCommand);
                    });

                    describe('and then the second child process finishes setting its state', () => {
                        let secondCommandExecutionRequest;
                        let secondCommandChildProcess;

                        beforeAll(async () => {
                            setStateRequest.respond();
                            ({executionRequest: secondCommandExecutionRequest, childProcess: secondCommandChildProcess} = await lifeCycle.getOrWaitForExecutionRequest());
                        });

                        it('execution of the second command should have started on the first instance', () => {
                            expect(secondCommandExecutionRequest.content).toEqual({
                                methodName: commandMethodName,
                                args: ['b'],
                                id: 4
                            });
                            expect(secondCommandChildProcess).toBe(firstChildProcess);
                        });

                        describe('and then the second command returns', () => {
                            const stateAfterSecondCommand = 4;
                            let secondSetStateRequest;

                            beforeAll(async () => {
                                secondCommandExecutionRequest.respond({state: stateAfterSecondCommand});
                                secondSetStateRequest = await secondChildProcess.getSetStateRequest();
                            });

                            it('the second child process should have been asked to set its state again', () => {
                                expect(secondSetStateRequest.content).toEqual(stateAfterSecondCommand);
                            });

                            it('should', async () => {
                                await new Promise(res => setTimeout(res, 100));
                                expect(true).toBe(true);
                            });
                        });
                    });
                });
            });
        });
    });
});