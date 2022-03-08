const StateWorker = require('../../dist/state-worker');
const path = require('path');

describe('a state worker', () => {
    let worker;

    beforeAll(async () => {
        worker = await StateWorker.create({path: path.resolve(__dirname, './examples/calculation-example.js'), maxNumberOfProcesses: 3});
    });

    afterAll(() => {
        worker.terminate();
    });

    it('should be able to execute a command and a list of queries', async () => {
        const [
            _,
            result1,
            result2,
            result3,
            result4,
            result5
        ] = await Promise.all([
            worker.initialize(2),
            worker.getDifferenceWith(1),
            worker.getDifferenceWith(2),
            worker.getDifferenceWith(3),
            worker.getDifferenceWith(4),
            worker.getDifferenceWith(5)]);
        expect(result1).toBe(-1);
        expect(result2).toBe(0);
        expect(result3).toBe(1);
        expect(result4).toBe(2);
        expect(result5).toBe(3);
    });
});