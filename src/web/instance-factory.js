import { WebStateWorkerInstance } from './state-worker-instance';

const webWorkerScriptString = `{{INSERT_WEB_WORKER_SCRIPT_STRING_HERE}}`;
let childProcessScriptPath;

export function instanceFactory(config){
    if(!childProcessScriptPath){
        childProcessScriptPath = URL.createObjectURL(new Blob([
            'self.req = function(url){return import(url);};',
            webWorkerScriptString
        ], {type: 'application/javascript'}));
    }
    return new WebStateWorkerInstance(childProcessScriptPath, config);
}