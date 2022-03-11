import { createStateWorkerFactory } from '../../src/state-worker-factory-factory';
import { FakeChildProcessFactory } from './fake-child-process-factory';
import { getNext } from '../../src/events/get-next';

describe('when we create a state worker', () => {
    const queryMethodName = 'getThings';
    let stateWorker;
    let childProcessFactory;
    let firstChildProcess;

    beforeAll(async () => {
        childProcessFactory = new FakeChildProcessFactory('http://base.uri');
        const creationPromise = (createStateWorkerFactory(() => childProcessFactory, p => p))({
            maxNumberOfProcesses: 3
        });
        firstChildProcess = childProcessFactory.childProcesses[0];
        const initialzationRequestPromise = getNext(firstChildProcess.initializationRequest);
        firstChildProcess.started.dispatch();
        await initialzationRequestPromise;
        firstChildProcess.initializationResponse.dispatch({methodCollection: {queries: [queryMethodName], commands: []}});
        stateWorker = await creationPromise;
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
                expect(childProcessFactory.childProcesses.length).toBe(1);
            });

            it('the first instance should have been asked for its state and the first request should have resolved', () => {
                expect(actualRequest1Response).toEqual(expectedRequest1Response)
            });
        });
    });
});