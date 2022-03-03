describe("initializing a state worker", function() {
    it("should throw when given a nonexistent file", async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: './foo.js', maxNumberOfProcesses: 2});
        })()).toBeRejectedWithError(/The script at '.*?foo\.js' failed to load/)
    });

    it("should throw when given a file in which 'commands' is a function", async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: 'base/test/web/examples/commands-is-a-function.js', maxNumberOfProcesses: 2});
        })()).toBeRejectedWithError('Exported member \'commands\' is not an object');
    });

    it("should throw when given a file in which 'queries' is a function", async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: 'base/test/web/examples/queries-is-a-function.js', maxNumberOfProcesses: 2});
        })()).toBeRejectedWithError('Exported member \'queries\' is not an object');
    });

    it("should throw when given an ES6 module file in which 'commands' is a function", async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: 'base/test/web/examples/commands-is-a-function-es6.js', maxNumberOfProcesses: 2, module: true});
        })()).toBeRejectedWithError('Exported member \'commands\' is not an object');
    });

    it("should throw when given a commonjs module file", async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: 'base/test/web/examples/commonjs-module.js', maxNumberOfProcesses: 2, module: true});
        })()).toBeRejectedWithError(/ReferenceError: module is not defined/);
    });

    it("should throw when given a file in which a command 'terminate' is defined", async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: 'base/test/web/examples/defines-command-terminate.js', maxNumberOfProcesses: 2});
        })()).toBeRejectedWithError('\'terminate\' cannot be used as the name of a command or a query');
    });

    it('should not throw if queries is not defined', async () => {
        const worker = await StateWorker.create({path: 'base/test/web/examples/queries-is-not-defined.js', maxNumberOfProcesses: 2});
        worker.terminate();
    });

    it('should not throw if commands is not defined', async () => {
        const worker = await StateWorker.create({path: 'base/test/web/examples/commands-is-not-defined.js', maxNumberOfProcesses: 2});
        worker.terminate();
    });
  });