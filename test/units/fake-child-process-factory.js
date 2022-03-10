import { FakeChildProcess } from "./fake-child-process";

export class FakeChildProcessFactory{
    constructor(baseURI){
        this.childProcesses = [];
        this.baseURI = baseURI;
    }
    createChildProcess(){
        const result = new FakeChildProcess();
        this.childProcesses.push(result);
        return result;
    }
}