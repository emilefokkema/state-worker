const StateWorker = require('../../dist/state-worker');
const path = require('path');

jest.setTimeout(10000);

describe('a state worker', () => {
    let worker;

    beforeAll(async () => {
        worker = await StateWorker.create({
            path: path.resolve(__dirname, './examples/async-query-example.js'),
            maxNumberOfProcesses: 4
        });
    });

    afterAll(() => {
        worker.terminate();
    });

    it('should be able to execute a command and a number of async queries', async () => {
        await worker.setState(0);
        const resultPromise = Promise.all([
            worker.getSum(1),
            worker.getSum(2),
            worker.getSum(3),
            worker.getSum(4),
            worker.getSum(5),
            worker.getSum(6),
            worker.getSum(7),
            worker.getSum(8)
        ]);
        expect(await resultPromise).toEqual([
            2, 3, 4, 5, 6, 7, 8, 9
        ])
    });
});