describe("initializing a state worker", function() {
    it("should throw when given a nonexistent file", async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: './foo.js', maxNumberOfProcesses: 2});
        })()).toBeRejectedWithError(/The script at '.*?foo\.js' failed to load/)
    });

    it("should throw when given a file in which 'commands' is not an object", async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: 'base/test/web/examples/commands-is-not-an-object.js', maxNumberOfProcesses: 2});
        })()).toBeRejectedWithError('Exported member \'commands\' is not an object');
    });
  });