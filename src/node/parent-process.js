const { parentPort } = require('worker_threads');

class NodeParentProcess{
    sendMessage(msg){
        parentPort.postMessage(msg);
    }
    addMessageEventListener(listener){
        parentPort.addListener('message', listener);
    }
    removeMessageEventListener(listener){
        parentPort.removeListener('message', listener);
    }
}

module.exports = { NodeParentProcess }