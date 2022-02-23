const { instanceFactory: nodeStateWorkerInstanceFactory } = require('./node/instance-factory');
const { instanceFactory: webStateWorkerInstanceFactory } = require('./web/instance-factory');
const { StateWorkerInstanceManager } = require('./state-worker-instance-manager');


class StateWorker{
    static async create(config){
        const instanceFactory = typeof window === 'undefined' ? nodeStateWorkerInstanceFactory : webStateWorkerInstanceFactory;
        const manager = StateWorkerInstanceManager.create(() => instanceFactory(config), config);
        const methodCollection = await manager.initialize();
        return new StateWorker();
    }
}

module.exports = StateWorker;