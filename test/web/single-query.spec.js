describe('a state worker', () => {
    let worker;

    beforeAll(async () => {
        worker = await StateWorker.create({path: 'base/test/web/examples/calculation-example.js', maxNumberOfProcesses: 2});
    });

    afterAll(() => {
        worker.terminate();
    });

    it('should be able to execute a command and a query', async () => {
        const [_, result] = await Promise.all([worker.initialize(2), worker.getDifferenceWith(1)]);
        expect(result).toBe(-1);
    });
});