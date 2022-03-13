import { getNext } from '../../src/events/get-next';
import { StateWorkerLifeCycle } from './state-worker-life-cycle';

describe('when we create a state worker', () => {
    const queryMethodName = 'getThings';
    let lifeCycle;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle('http://base.uri', {
            maxNumberOfProcesses: 3
        });
        await lifeCycle.finishCreation({methodCollection: {queries: [queryMethodName], commands: []}})
    });

    it('should be there', () => {
        expect(lifeCycle.stateWorker).toBeTruthy();
    });

    describe('and then we make four requests (one more than the max number of processes)', () => {
        let request1, request2, request3, request4;
        let firstExecutionRequest;

        beforeAll(async () => {
            const firstExecutionRequestPromise = getNext(lifeCycle.executionRequested);
            request1 = lifeCycle.addRequest(queryMethodName, [1]);
            request2 = lifeCycle.addRequest(queryMethodName, [2]);
            request3 = lifeCycle.addRequest(queryMethodName, [3]);
            request4 = lifeCycle.addRequest(queryMethodName, [4]);
            const [_, executionRequest] = await firstExecutionRequestPromise;
            firstExecutionRequest = executionRequest;
        });

        it('should have asked to execute the first request', () => {
            expect(firstExecutionRequest.content).toEqual({
                methodName: queryMethodName,
                args: request1.args,
                isCommand: false
            })
        });

        describe('and then the first instance responds to the first request', () => {
            const expectedRequest1Response = 'a';
            let actualRequest1Response;
            let stateRequest;

            beforeAll(async () => {
                const stateRequestPromise = getNext(lifeCycle.stateRequested);
                firstExecutionRequest.respond({result: expectedRequest1Response});
                actualRequest1Response = await request1.resultPromise;
                const [_, _stateRequest] = await stateRequestPromise;
                stateRequest = _stateRequest;
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

                beforeAll(async () => {
                    const secondExecutionRequestPromise = getNext(lifeCycle.executionRequested);
                    stateRequest.respond(state);
                    const [_, executionRequest] = await secondExecutionRequestPromise;
                    secondExecutionRequest = executionRequest;
                });

                it('should have asked the first instance to execute the second request', () => {
                    expect(secondExecutionRequest.content).toEqual({
                        methodName: queryMethodName,
                        args: request2.args,
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