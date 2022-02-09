const { NodeStateWorkerInstance } = require('./node-state-worker-instance');
const { StateWorkerInstanceManager } = require('./state-worker-instance-manager');

class NodeStateWorker{
	constructor(){
	}
	static async create(path, config){
		const manager = StateWorkerInstanceManager.create(() => new NodeStateWorkerInstance(path), config);
		const methodCollection = await manager.initialize();
		return new NodeStateWorker();
	}
}

module.exports = { NodeStateWorker }