describe('a state worker', () => {
    let worker;

    beforeAll(async () => {
        worker = await StateWorker.create({path: 'base/test/web/examples/query-throws-error.js', maxNumberOfProcesses: 2, module: true});
    });

    afterAll(() => {
        worker.terminate();
    });

    it('should throw when query throws', async () => {
        await expectAsync((async () => {
            const result = await worker.getSomething();
        })()).toBeRejectedWithError('Error: failed to get something');
    });
});