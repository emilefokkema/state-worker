import { StateWorkerLifeCycle } from './state-worker-life-cycle';

describe('when creation of a state worker is requested', () => {
    const queryMethodName = 'getNumber';
    const commandMethodName = 'setNumber';
    const baseUri = 'http://base.uri/';
    const config = {
        maxNumberOfProcesses: 3
    };
    let lifeCycle;

    beforeAll(async () => {
        lifeCycle = new StateWorkerLifeCycle(baseUri, config);
        await lifeCycle.start();
    });

    it('a child process should have been created', () => {
        expect(lifeCycle.firstChildProcess).toBeTruthy();
    });

    it('it should be the only one', () => {
        expect(lifeCycle.getNumberOfChildProcesses()).toBe(1);
    });

    describe('and then the child process sends a message saying that it has started', () => {

        beforeAll(async () => {
            await lifeCycle.notifyFirstChildProcessStarted();
        });

        it('it should have received an initialization message', () => {
            const content = lifeCycle.firstInitializationRequest.content;
            expect(content).toBeTruthy();
            expect(content.baseURI).toEqual(baseUri);
            expect(content.config).toEqual(config);
        });

        describe('and then the child process completes initialization', () => {

            beforeAll(async () => {
                await lifeCycle.finishCreation({methodCollection: {queries: [queryMethodName], commands: [commandMethodName]}});
            });

            it('the state worker should have been created', () => {
                const stateWorker = lifeCycle.stateWorker;
                expect(stateWorker).toBeTruthy();
                expect(stateWorker[queryMethodName]).toBeInstanceOf(Function);
                expect(stateWorker[commandMethodName]).toBeInstanceOf(Function);
            });
        });
    });
});