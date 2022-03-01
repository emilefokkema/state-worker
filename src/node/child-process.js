const { Worker } = require('worker_threads');

class NodeChildProcess{
    constructor(worker){
        this.worker = worker;
    }
    terminate(){
        this.worker.terminate();
    }
    sendMessage(msg){
        this.worker.postMessage(msg);
    }
    addMessageEventListener(listener){
        this.worker.addListener('message', listener);
    }
    removeMessageEventListener(listener){
        this.worker.removeListener('message', listener);
    }
    static create(path){
        const worker = new Worker(path);
        worker.on('error', (e) => {
            console.log(`error from worker`, e)
        });
        worker.on('exit', () => {
            console.log(`worker has exited`)
        });
        return new NodeChildProcess(worker);
    }
}

module.exports = { NodeChildProcess };