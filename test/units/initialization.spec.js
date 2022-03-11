import { createStateWorkerFactory } from '../../src/state-worker-factory-factory';
import { FakeChildProcessFactory } from './fake-child-process-factory';
import { getNext } from '../../src/events/get-next';

describe('when creation of a state worker is requested', () => {
    const queryMethodName = 'getNumber';
    const commandMethodName = 'setNumber';
    const baseUri = 'http://base.uri/';
    const config = {
        maxNumberOfProcesses: 3
    };
    let stateWorkerCreationPromise;
    let childProcessFactory;

    beforeAll(() => {
        childProcessFactory = new FakeChildProcessFactory(baseUri);
        stateWorkerCreationPromise = (createStateWorkerFactory(() => childProcessFactory, p => p))(config);
    });

    describe('and we look for a created child process', () => {
        let firstChildProcess;

        beforeAll(() => {
            firstChildProcess = childProcessFactory.childProcesses[0];
        });

        it('it should be there', () => {
            expect(firstChildProcess).toBeTruthy();
        });

        it('it should be the only one', () => {
            expect(childProcessFactory.childProcesses.length).toBe(1);
        });

        describe('and then the child process sends a message saying that it has started', () => {
            let initializationRequest;

            beforeAll(async () => {
                const initialzationRequestPromise = getNext(firstChildProcess.initializationRequest);
                firstChildProcess.started.dispatch();
                [initializationRequest] = await initialzationRequestPromise;
            });

            it('it should have received an initialization message', () => {
                expect(initializationRequest).toBeTruthy();
                expect(initializationRequest.baseURI).toEqual(baseUri);
                expect(initializationRequest.config).toEqual(config);
            });

            describe('and then the child process completes initialization', () => {
                let stateWorker;

                beforeAll(async () => {
                    firstChildProcess.initializationResponse.dispatch({methodCollection: {queries: [queryMethodName], commands: [commandMethodName]}});
                    stateWorker = await stateWorkerCreationPromise;
                });

                it('the state worker should have been created', () => {
                    expect(stateWorker).toBeTruthy();
                    expect(stateWorker[queryMethodName]).toBeInstanceOf(Function);
                    expect(stateWorker[commandMethodName]).toBeInstanceOf(Function);
                });
            });
        });
    });
});