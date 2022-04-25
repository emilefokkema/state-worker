import { ExecutionManager } from './execution-manager';
import { StateWorkerInstance } from './state-worker-instance';
import { StateWorker } from './state-worker';

export function createStateWorkerFactory(childProcessFactoryFactory, childProcessWrapper){
    return async function createStateWorker(config){
        const childProcessFactory = childProcessFactoryFactory();
        const manager = ExecutionManager.create(
            (id) => new StateWorkerInstance(
                () => childProcessWrapper(childProcessFactory.createChildProcess(config)),
                config,
                childProcessFactory.baseURI,
                id),
            config);
        const {queries, commands} = await manager.initialize();
        return new StateWorker(manager, queries, commands);
    }
}