const StateWorker = require('../../dist/state-worker');
const path = require('path');

describe('a state worker', () => {
    let worker;

    beforeAll(async () => {
        worker = await StateWorker.create({path: path.resolve(__dirname, './examples/query-throws-error.js'), maxNumberOfProcesses: 2});
    });

    afterAll(() => {
        worker.terminate();
    });

    it('should throw when query throws', async () => {
        await expectAsync((async () => {
            const result = await worker.getSomething();
        })()).toBeRejectedWith('Error: failed to get something');
    });
});