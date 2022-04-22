import { StateWorkerLifeCycle } from './state-worker-life-cycle';
import { FakeChildProcessFactory } from './fake-child-process-factory';

describe('when we create a state worker', () => {
    const commandMethodName = 'doThings';
    const queryMethodName = 'getThings';
    const baseURI = 'http://base.uri';
    const config = {
        maxNumberOfProcesses: 2
    };
    const initializationResponse = {
        methodCollection: {queries: [queryMethodName], commands: [commandMethodName]}
    };
    let lifeCycle;
    let stateWorker;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(new FakeChildProcessFactory(baseURI));
        ({stateWorker} = await lifeCycle.createStateWorker(config, initializationResponse));
    });

    describe('and we add a command and two queries', () => {
        let commandChildProcess;
        let commandExecutionRequest;

        beforeAll(async () => {
            stateWorker[commandMethodName]('a');
            stateWorker[queryMethodName](1);
            stateWorker[queryMethodName](2);
            ({childProcess: commandChildProcess, executionRequest: commandExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
        });

        it('should have started to execute the command', () => {
            expect(commandExecutionRequest.content).toEqual({
                methodName: commandMethodName,
                args: ['a'],
                executionId: 0
            });
        });

        describe('and then the command returns', () => {
            const state = 2;
            let firstQueryExecutionRequest;
            let firstQueryChildProcess;
            let secondChildProcessInitializationRequest;

            beforeAll(async () => {
                commandExecutionRequest.respond({state});
                ({childProcess: firstQueryChildProcess, executionRequest: firstQueryExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                const secondChildProcess = await lifeCycle.getOrWaitForChildProcess();
                secondChildProcess.started.dispatch();
                secondChildProcessInitializationRequest = await secondChildProcess.getInitializationRequest();
            });

            it('should have asked the first child process to execute the first query', () => {
                expect(firstQueryExecutionRequest.content).toEqual({
                    methodName: queryMethodName,
                    args: [1],
                    executionId: 1
                });
                expect(firstQueryChildProcess).toBe(commandChildProcess);
            });

            it('should have asked the second child process to initialize', () => {
                expect(secondChildProcessInitializationRequest.content).toEqual({
                    baseURI,
                    config,
                    state
                });
            });

            describe('and then the second child process initializes', () => {
                let secondQueryExecutionRequest;
                let secondQueryChildProcess;

                beforeAll(async () => {
                    secondChildProcessInitializationRequest.respond(initializationResponse);
                    ({childProcess: secondQueryChildProcess, executionRequest: secondQueryExecutionRequest} = await lifeCycle.getOrWaitForExecutionRequest());
                });

                it('should have asked the second child process to execute the second query', () => {
                    expect(secondQueryExecutionRequest.content).toEqual({
                        methodName: queryMethodName,
                        args: [2],
                        executionId: 2
                    });
                    expect(secondQueryChildProcess).not.toBe(commandChildProcess);
                });
            });
        });
    });
});