import { FakeParentProcess } from './fake-parent-process';
import { FakeMethodImporter } from './fake-method-importer';
import { start } from '../../src/child-process';
import { getNext } from '../../src/events/get-next';

describe('a child process', () => {
    let parentProcess;
    let commands;
    let queries;
    let startedPromise;

    beforeAll(() => {
        parentProcess = new FakeParentProcess();
        startedPromise = getNext(parentProcess.started);
        commands = {
            add(x){
                this.state = this.state + x;
            }
        };
        queries = {
            getSum(x){
                return this.state + x;
            }
        };
        const methodImporter = new FakeMethodImporter({commands, queries});
        start(methodImporter, parentProcess);
    });

    it('should have sent a message that it has started', async () => {
        await startedPromise;
    });

    describe('when it is sent an initialization message', () => {
        const initialState = 0;
        let initializationResponsePromise;

        beforeAll(() => {
            initializationResponsePromise = parentProcess.initialize({config: {}, baseURI: 'http://base.uri', state: initialState});
        });

        it('should respond correctly', async () => {
            expect(await initializationResponsePromise).toEqual({
                methodCollection: {
                    queries: ['getSum'],
                    commands: ['add']
                }
            })
        });

        describe('and then a command is executed', () => {
            let commandExecutionResponsePromise;

            beforeAll(() => {
                commandExecutionResponsePromise = parentProcess.execute({methodName: 'add', args: [1], executionId: 0});
            });

            it('should respond correctly', async () => {
                expect(await commandExecutionResponsePromise).toEqual({})
            });

            it('should return its state', async () => {
                expect(await parentProcess.getState()).toEqual(1);
            });

            it('should respond to queries correctly', async () => {
                expect(await parentProcess.execute({methodName: 'getSum', args: [1], executionId: 1})).toEqual({result: 2})
                expect(await parentProcess.execute({methodName: 'getSum', args: [2], executionId: 2})).toEqual({result: 3})
            });
        });
    });
});