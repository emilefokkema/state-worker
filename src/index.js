const { createChildProcessFactory } = require('./child-process-factory-factory');
const { createStateWorkerFactory } = require('./state-worker-factory-factory');
const { wrapChildProcess } = require('./child-process-wrapper');

const createStateWorker = createStateWorkerFactory(createChildProcessFactory, wrapChildProcess);

module.exports = { create: createStateWorker };