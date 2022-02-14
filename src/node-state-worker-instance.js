const { fork } = require('child_process')

class NodeStateWorkerInstance{
	constructor(path){
		this.path = path;
		this.process = undefined;
	}
	initialize(){
		return new Promise((res, rej) => {
			console.log('creating child process')
			try{
				this.process = fork('./node-state-worker-child-process.js', [], {
					stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ],
					serialization: 'advanced'
				});
				this.process.stdout.on('data', (data) => {
					console.log(data.toString())
					res();
				});
				this.process.on('error', (err) => {
					console.log('child process error: rejecting the promise')
					rej(err);
				});
				this.process.stderr.on('data', (data) => {
					console.log('data from stderr')
					console.log(data.toString())
				});
				this.process.on('exit', (code, signal) => {
					if(code === 0){
						return res();
					}
					console.log('exit: rejecting the promise')
					rej();
				});
			}catch(e){
				console.log(e)
			}
			
		})
		
	}
}

module.exports = { NodeStateWorkerInstance }