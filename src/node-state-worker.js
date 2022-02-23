const path = require("path")
const { NodeStateWorkerInstance } = require('./node-state-worker-instance');
const { StateWorkerInstanceManager } = require('./state-worker-instance-manager');

class NodeStateWorker{
	constructor(){
	}
	static async create(config){
		const stateWorkerInstancePath = path.resolve(__dirname, './child-process.js');
		const manager = StateWorkerInstanceManager.create(() => new NodeStateWorkerInstance(stateWorkerInstancePath, config), config);
		const methodCollection = await manager.initialize();
		return new NodeStateWorker();
	}
}

module.exports = { NodeStateWorker }