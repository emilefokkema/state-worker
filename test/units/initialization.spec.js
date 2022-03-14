import { StateWorkerLifeCycle } from './state-worker-life-cycle';
import { FakeChildProcessFactory } from './fake-child-process-factory';

describe('when creation of a state worker is requested', () => {
    const queryMethodName = 'getNumber';
    const commandMethodName = 'setNumber';
    const baseUri = 'http://base.uri/';
    const config = {
        maxNumberOfProcesses: 3
    };
    let lifeCycle;
    let childProcess;

    beforeAll(async () => {
        const childProcessFactory = new FakeChildProcessFactory(baseUri);
        lifeCycle = new StateWorkerLifeCycle(childProcessFactory);
        lifeCycle.begin(config);
        childProcess = await lifeCycle.getOrWaitForChildProcess();
    });

    it('a child process should have been created', () => {
        expect(childProcess).toBeTruthy();
    });

    it('it should be the only one', () => {
        expect(lifeCycle.getAllChildProcesses().length).toBe(0);
    });

    describe('and then the child process sends a message saying that it has started', () => {
        let initializationRequest;

        beforeAll(async () => {
            childProcess.started.dispatch();
            initializationRequest = await childProcess.getInitializationRequest();
        });

        it('it should have received an initialization message', () => {
            const content = initializationRequest.content;
            expect(content).toBeTruthy();
            expect(content.baseURI).toEqual(baseUri);
            expect(content.config).toEqual(config);
        });

        describe('and then the child process completes initialization', () => {
            let stateWorker;

            beforeAll(async () => {
                initializationRequest.respond({methodCollection: {queries: [queryMethodName], commands: [commandMethodName]}});
                stateWorker = await lifeCycle.getOrWaitForStateWorker();
            });

            it('the state worker should have been created', () => {
                expect(stateWorker).toBeTruthy();
                expect(stateWorker[queryMethodName]).toBeInstanceOf(Function);
                expect(stateWorker[commandMethodName]).toBeInstanceOf(Function);
            });
        });
    });
});