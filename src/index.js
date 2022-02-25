const { ChildProcessFactory: NodeChildProcessFactory } = require('./node/child-process-factory');
const { ChildProcessFactory: WebChildProcessFactory } = require('./web/child-process-factory');
const { StateWorkerInstanceManager } = require('./state-worker-instance-manager');
const { StateWorkerInstance } = require('./state-worker-instance');


class StateWorker{
    constructor(manager, queries, commands){
        for(let query of queries){
            this[query] = function(...args){
                return manager.executeQuery(query, args);
            };
        }
        for(let command of commands){
            this[command] = function(...args){
                return manager.executeCommand(command, args);
            }
        }
        this.terminate = () => manager.terminate();
    }
    static async create(config){
        const childProcessFactory = typeof window === 'undefined' ? new NodeChildProcessFactory() : new WebChildProcessFactory();
        const manager = StateWorkerInstanceManager.create(
            () => new StateWorkerInstance(
                () => childProcessFactory.createChildProcess(config),
                config,
                childProcessFactory.baseURI),
            config);
        const {queries, commands} = await manager.initialize();
        return new StateWorker(manager, queries, commands);
    }
}

module.exports = StateWorker;