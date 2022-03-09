import { StateWorkerInstanceManager } from './state-worker-instance-manager';
import { StateWorkerInstance } from './state-worker-instance';
import { StateWorker } from './state-worker';

export function createStateWorkerFactory(childProcessFactoryFactory){
    return async function createStateWorker(config){
        const childProcessFactory = childProcessFactoryFactory();
        const manager = StateWorkerInstanceManager.create(
            (id) => new StateWorkerInstance(
                () => childProcessFactory.createChildProcess(config),
                config,
                childProcessFactory.baseURI,
                id),
            config);
        const {queries, commands} = await manager.initialize();
        return new StateWorker(manager, queries, commands);
    }
}