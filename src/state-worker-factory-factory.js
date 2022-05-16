import { ExecutionManager } from './execution-manager';
import { StateWorker } from './state-worker';

export function createStateWorkerFactory(childProcessFactoryFactory, childProcessWrapper){
    return async function createStateWorker(config){
        const childProcessFactory = childProcessFactoryFactory();
        const manager = ExecutionManager.create(
            config,
            (id) => childProcessWrapper(childProcessFactory.createChildProcess(config)),
            childProcessFactory.baseURI);
        const {queries, commands} = await manager.initialize();
        return new StateWorker(manager, queries, commands);
    }
}