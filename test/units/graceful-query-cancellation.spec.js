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
            let firstCommandResultPromise;
            let secondCommandResultPromise;
            let sixthQueryResultPromise;

            beforeAll(() => {
                firstCommandResultPromise = stateWorker[commandMethodName]('a');
                secondCommandResultPromise = stateWorker[commandMethodName]('b');
                sixthQueryResultPromise = stateWorker[queryMethodName](6);
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

                it('should', async () => {
                    await new Promise(res => setTimeout(res, 700));
                    expect(true).toBe(true);
                });
            });
        });
    });
});