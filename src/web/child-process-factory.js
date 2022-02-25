import { WebChildProcess } from './child-process';

const webWorkerScriptString = `{{INSERT_WEB_WORKER_SCRIPT_STRING_HERE}}`;

export class ChildProcessFactory{
    constructor(){
        this.childProcessScriptPath = undefined;
    }
    get baseURI(){
        return document.baseURI;
    }
    createChildProcess(config){
        if(!this.childProcessScriptPath){
            this.childProcessScriptPath = URL.createObjectURL(new Blob([
                'self.req = function(url){return import(url);};',
                webWorkerScriptString
            ], {type: 'application/javascript'}));
        }
        return WebChildProcess.create(this.childProcessScriptPath, !!config.module);
    }
}