import { getNext } from '../../src/events/get-next';
import { StateWorkerLifeCycle } from './state-worker-life-cycle';

describe('when we create a state worker', () => {
    const queryMethodName = 'getThings';
    let stateWorker;
    let firstChildProcess;
    let lifeCycle;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle('http://base.uri');
        firstChildProcess = await lifeCycle.start({
            maxNumberOfProcesses: 3
        });
        const initializationRequest = await firstChildProcess.notifyStarted();
        stateWorker = await lifeCycle.finishCreation(
            initializationRequest,
            {methodCollection: {queries: [queryMethodName], commands: []}})
    });

    it('should be there', () => {
        expect(stateWorker).toBeTruthy();
    });

    describe('and then we make four requests (one more than the max number of processes)', () => {
        const request1Argument = 1;
        let request1Promise;
        const request2Argument = 2;
        let request2Promise;
        const request3Argument = 3;
        let request3Promise;
        const request4Argument = 4;
        let request4Promise;
        let firstExecutionRequest;
        let firstExecutionRequestId;

        beforeAll(async () => {
            const firstExecutionRequestPromise = getNext(firstChildProcess.executionRequest);
            request1Promise = stateWorker[queryMethodName](request1Argument);
            request2Promise = stateWorker[queryMethodName](request2Argument);
            request3Promise = stateWorker[queryMethodName](request3Argument);
            request4Promise = stateWorker[queryMethodName](request4Argument);
            [firstExecutionRequest, firstExecutionRequestId] = await firstExecutionRequestPromise;
        });

        it('should have asked the first instance to execute the first request', () => {
            expect(firstExecutionRequest).toEqual({
                methodName: queryMethodName,
                args: [request1Argument],
                isCommand: false
            })
        });

        describe('and then the first instance responds to the first request', () => {
            const expectedRequest1Response = 'a';
            let actualRequest1Response;

            beforeAll(async () => {
                const stateRequestPromise = getNext(firstChildProcess.stateRequest);
                firstChildProcess.executionResponse.dispatch(firstExecutionRequestId, {result: expectedRequest1Response});
                [actualRequest1Response] = await Promise.all([request1Promise, stateRequestPromise]);
            });

            it('no further instances should have been created yet', () => {
                expect(lifeCycle.getNumberOfChildProcesses()).toBe(1);
            });

            it('the first instance should have been asked for its state and the first request should have resolved', () => {
                expect(actualRequest1Response).toEqual(expectedRequest1Response)
            });

            describe('and then the first instance returns its state', () => {
                const state = 42;
                let secondExecutionRequest;
                let secondExecutionRequestId;

                beforeAll(async () => {
                    const secondExecutionRequestPromise = getNext(firstChildProcess.executionRequest);
                    firstChildProcess.stateResponse.dispatch(state);
                    [secondExecutionRequest, secondExecutionRequestId] = await secondExecutionRequestPromise;
                });

                it('should have asked the first instance to execute the second request', () => {
                    expect(secondExecutionRequest).toEqual({
                        methodName: queryMethodName,
                        args: [request2Argument],
                        isCommand: false
                    })
                });

                it('should have created two new instances', () => {
                    expect(lifeCycle.getNumberOfChildProcesses()).toBe(3);
                });
            });
        });
    });
});