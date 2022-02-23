const path = require("path")
const { StateWorkerInstance } = require('../state-worker-instance');
const { NodeChildProcess } = require('./child-process');

export function instanceFactory(config){
    const stateWorkerInstancePath = path.resolve(__dirname, './child-process.js');
    return new StateWorkerInstance(() => NodeChildProcess.create(stateWorkerInstancePath), config);
}