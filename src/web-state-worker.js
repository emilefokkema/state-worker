import { StateWorkerInstanceManager } from './state-worker-instance-manager';
import { WebStateWorkerInstance } from './web-state-worker-instance';

const webWorkerScriptString = `{{INSERT_WEB_WORKER_SCRIPT_STRING_HERE}}`

export class WebStateWorker{
	constructor(){
	
	}
	static async create(config){
		const childProcessScriptPath = URL.createObjectURL(new Blob(['self.req = function(url){return import(url);};',webWorkerScriptString], {type: 'application/javascript'}));
		const manager = StateWorkerInstanceManager.create(() => new WebStateWorkerInstance(childProcessScriptPath, config), config);
		const methodCollection = await manager.initialize();
		return new WebStateWorker();
	}
}