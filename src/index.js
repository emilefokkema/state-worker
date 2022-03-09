const { createChildProcessFactory } = require('./child-process-factory-factory');
const { createStateWorkerFactory } = require('./state-worker-factory-factory');

const createStateWorker = createStateWorkerFactory(createChildProcessFactory);

module.exports = { create: createStateWorker };