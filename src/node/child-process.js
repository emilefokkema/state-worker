const cp = require('child_process');

class NodeChildProcess{
    constructor(process){
        this.process = process;
    }
    terminate(){
        this.process.kill();
    }
    sendMessage(msg){
        this.process.send(msg);
    }
    addMessageEventListener(listener){
        this.process.addListener('message', listener);
    }
    removeMessageEventListener(listener){
        this.process.removeListener('message', listener);
    }
    static create(path){
        const process = cp.fork(path, [], {
			stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ],
			serialization: 'advanced'
		});
		process.stdout.on('data', (data) => {
			console.log(data.toString())
		});
		process.on('error', (err) => {
			console.log('child process error', err)
		});
		process.stderr.on('data', (data) => {
			console.log('data from stderr')
			console.log(data.toString())
		});
		process.on('exit', (code, signal) => {
			console.log('child process has exited')
		});
        return new NodeChildProcess(process);
    }
}

module.exports = { NodeChildProcess };