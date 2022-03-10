import { createStateWorkerFactory } from '../../src/state-worker-factory-factory';
import { FakeChildProcessFactory } from './fake-child-process-factory';

describe('when creation of a state worker is requested', () => {
    const baseUri = 'http://base.uri/';
    const config = {
        maxNumberOfProcesses: 3
    };
    let stateWorkerCreationPromise;
    let childProcessFactory;

    beforeAll(() => {
        childProcessFactory = new FakeChildProcessFactory(baseUri);
        stateWorkerCreationPromise = (createStateWorkerFactory(() => childProcessFactory))(config);
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
            let initializingMessage;

            beforeAll(async () => {
                const initializingMessagePromise = firstChildProcess.messageReceived.getNext(({type}) => type === 'initialize');
                firstChildProcess.sendMessageFromChildProcess({type: 'started'});
                [initializingMessage] = await initializingMessagePromise;
            });

            it('it should have received an initialization message', () => {
                expect(initializingMessage).toBeTruthy();
                expect(initializingMessage.baseURI).toEqual(baseUri);
                expect(initializingMessage.config).toEqual(config);
            });
        });
    });
});