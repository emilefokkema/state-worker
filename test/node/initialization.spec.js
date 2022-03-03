const StateWorker = require('../../dist/state-worker');
const path = require('path');

describe("initializing a state worker", function() {
    it("should throw when given a nonexistent file", async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: './foo.js', maxNumberOfProcesses: 2});
        })()).toBeRejectedWithError(/Cannot find module '\.\/foo\.js'/)
    });

    it("should throw when given a file in which 'commands' is not an object", async () => {
        await expectAsync((async () => {
            const worker = await StateWorker.create({path: path.resolve(__dirname, './examples/commands-is-not-an-object.js'), maxNumberOfProcesses: 2});
        })()).toBeRejectedWithError('Exported member \'commands\' is not an object');
    });
  });