const StateWorker = require('../../dist/state-worker');
const path = require('path');

describe("initializing a state worker", function() {
    it('should throw when given a nonexistent file', async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: './foo.js', maxNumberOfProcesses: 2});
        })()).toBeRejectedWithError(/Cannot find module '\.\/foo\.js'/)
    });

    it('should throw when given a file in which \'commands\' is a function', async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: path.resolve(__dirname, './examples/commands-is-a-function.js'), maxNumberOfProcesses: 2});
        })()).toBeRejectedWithError('Exported member \'commands\' is not an object');
    });

    it('should throw when given a file in which \'queries\' is a function', async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: path.resolve(__dirname, './examples/queries-is-a-function.js'), maxNumberOfProcesses: 2});
        })()).toBeRejectedWithError('Exported member \'queries\' is not an object');
    });

    it('should throw when given a file in which a command \'terminate\' is defined', async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: path.resolve(__dirname, './examples/defines-command-terminate.js'), maxNumberOfProcesses: 2});
        })()).toBeRejectedWithError('\'terminate\' cannot be used as the name of a command or a query');
    });

    it('should not throw if queries is not defined', async () => {
        const worker = await StateWorker.create({path: path.resolve(__dirname, './examples/queries-is-not-defined.js'), maxNumberOfProcesses: 2});
        worker.terminate();
    });

    it('should not throw if commands is not defined', async () => {
        const worker = await StateWorker.create({path: path.resolve(__dirname, './examples/commands-is-not-defined.js'), maxNumberOfProcesses: 2});
        worker.terminate();
    });
  });