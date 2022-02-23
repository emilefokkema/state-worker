const path = require("path")
const { NodeStateWorkerInstance } = require('./state-worker-instance');

export function instanceFactory(config){
    const stateWorkerInstancePath = path.resolve(__dirname, './child-process.js');
    return new NodeStateWorkerInstance(stateWorkerInstancePath, config);
}