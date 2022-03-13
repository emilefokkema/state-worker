import { StateWorkerLifeCycle } from './state-worker-life-cycle';

describe('when creation of a state worker is requested', () => {
    const queryMethodName = 'getNumber';
    const commandMethodName = 'setNumber';
    const baseUri = 'http://base.uri/';
    const config = {
        maxNumberOfProcesses: 3
    };
    let firstChildProcess;
    let lifeCycle;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(baseUri);
        firstChildProcess = await lifeCycle.start(config);
    });

    it('a child process should have been created', () => {
        expect(firstChildProcess).toBeTruthy();
    });

    it('it should be the only one', () => {
        expect(lifeCycle.getNumberOfChildProcesses()).toBe(1);
    });

    describe('and then the child process sends a message saying that it has started', () => {
        let initializationRequest;

        beforeAll(async () => {
            initializationRequest = await firstChildProcess.notifyStarted();
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
                stateWorker = await lifeCycle.finishCreation(
                    initializationRequest,
                    {methodCollection: {queries: [queryMethodName], commands: [commandMethodName]}});
            });

            it('the state worker should have been created', () => {
                expect(stateWorker).toBeTruthy();
                expect(stateWorker[queryMethodName]).toBeInstanceOf(Function);
                expect(stateWorker[commandMethodName]).toBeInstanceOf(Function);
            });
        });
    });
});