export class WebStateWorkerInstance{
    constructor(childProcessScriptPath, config){
        this.childProcessScriptPath = childProcessScriptPath;
        this.config = config;
        this.worker = undefined;
    }
    whenReceivedMessageOfType(type){
		return new Promise((res) => {
			const listener = ({data: msg}) => {
				if(msg.type === type){
					this.worker.removeEventListener('message', listener);
					res(msg);
				}
			};
			this.worker.addEventListener('message', listener);
		});
	}
    createProcess(){
        console.log('going to create worker')
        this.worker = new Worker(this.childProcessScriptPath, {type: this.config.module ? 'module' : 'classic'});
        this.worker.addEventListener('error', (e) => {console.log(e)})
    }
    async initialize(){
        this.createProcess();
        await this.whenReceivedMessageOfType('started');
        const initializedPromise = this.whenReceivedMessageOfType('initialized');
        this.worker.postMessage({type: 'initialize', config: this.config, baseURI: document.baseURI});
        const result = await initializedPromise;
        if(result.error){
			throw new Error(result.error);
		}
		return result.methodCollection;
    }
}