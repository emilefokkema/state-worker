import { StateWorkerInstance } from '../state-worker-instance';
import { WebChildProcess } from './child-process';

const webWorkerScriptString = `{{INSERT_WEB_WORKER_SCRIPT_STRING_HERE}}`;
let childProcessScriptPath;

export function instanceFactory(config){
    if(!childProcessScriptPath){
        childProcessScriptPath = URL.createObjectURL(new Blob([
            'self.req = function(url){return import(url);};',
            webWorkerScriptString
        ], {type: 'application/javascript'}));
    }
    return new StateWorkerInstance(() => WebChildProcess.create(childProcessScriptPath, !!config.module), config, document.baseURI);
}