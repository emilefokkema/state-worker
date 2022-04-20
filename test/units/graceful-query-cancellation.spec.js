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

    describe('and we begin executing four queries, resulting in two active child processes', () => {
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

        beforeAll(async () => {
            let firstExecutionRequest;
            stateWorker[queryMethodName](1);
            secondQueryResultPromise = stateWorker[asyncQueryMethodName](2);
            thirdQueryResultPromise = stateWorker[queryMethodName](3);
            fourthQueryResultPromise = stateWorker[queryMethodName](4);
            ({childProcess: firstExecutionRequestChildProcess, executionRequest: firstExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
            firstExecutionRequest.respond({result: 9});
            const stateRequest = await firstExecutionRequestChildProcess.getStateRequest();
            stateRequest.respond(0);
            ({childProcess: secondExecutionRequestChildProcess, executionRequest: secondExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
            [secondChildProcess, thirdChildProcess] = await lifeCycle.getOrWaitForNumberOfChildProcesses(2);
            secondChildProcess.started.dispatch();
            const initializationRequest = await secondChildProcess.getInitializationRequest();
            initializationRequest.respond(initializationResponse);
            ({childProcess: thirdExecutionRequestChildProcess, executionRequest: thirdExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
            firstExecutionRequestChildProcess.onIdle.dispatch();
            ({childProcess: fourthExecutionRequestChildProcess, executionRequest: fourthExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
            firstExecutionRequestChildProcess.requestIdle();
        });

        it('the right requests should have been sent to the right processes', () => {
            expect(secondExecutionRequest.content).toEqual({
                methodName: asyncQueryMethodName,
                args: [2]
            });
            expect(thirdExecutionRequest.content).toEqual({
                methodName: queryMethodName,
                args: [3]
            });
            expect(fourthExecutionRequest.content).toEqual({
                methodName: queryMethodName,
                args: [4]
            });
            expect(firstExecutionRequestChildProcess).toBe(secondExecutionRequestChildProcess);
            expect(firstExecutionRequestChildProcess).toBe(fourthExecutionRequestChildProcess);
            expect(firstExecutionRequestChildProcess).not.toBe(thirdExecutionRequestChildProcess);
            expect(thirdExecutionRequestChildProcess).toBe(secondChildProcess)
        });

        describe('and then two commands and a query are added', () => {
            let firstCommandResultPromise;
            let secondCommandResultPromise;
            let fifthQueryResultPromise;

            beforeAll(() => {
                firstCommandResultPromise = stateWorker[commandMethodName]('a');
                secondCommandResultPromise = stateWorker[commandMethodName]('b');
                fifthQueryResultPromise = stateWorker[queryMethodName](5);
            });

            it('should', async () => {
                await new Promise(res => setTimeout(res, 200));
                expect(true).toBe(true);
            });
        });
    });
});