const path = require("path")
const { NodeChildProcess } = require('./child-process');

export class ChildProcessFactory{
    constructor(){
        this.stateWorkerInstancePath = undefined;
    }
    get baseURI(){
        return undefined;
    }
    createChildProcess(config){
        if(!this.stateWorkerInstancePath){
            this.stateWorkerInstancePath = path.resolve(__dirname, './child-process.js');
        }
        return NodeChildProcess.create(this.stateWorkerInstancePath);
    }
}