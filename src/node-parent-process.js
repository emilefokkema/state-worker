class NodeParentProcess{
    sendMessage(msg){
        process.send(msg);
    }
    addMessageEventListener(listener){
        process.addListener('message', listener);
    }
    removeMessageEventListener(listener){
        process.removeListener('message', listener);
    }
}

module.exports = { NodeParentProcess }