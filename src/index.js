const { WebStateWorker } = require('./web-state-worker');
const { NodeStateWorker} = require('./node-state-worker');

class StateWorker{
    static create(scriptPath, config){
        if(typeof window === 'undefined'){
            return NodeStateWorker.create(scriptPath, config);
        }
        return WebStateWorker.create(scriptPath, config);
    }
}

module.exports = StateWorker;