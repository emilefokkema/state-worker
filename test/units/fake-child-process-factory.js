import { FakeChildProcess } from "./fake-child-process";
import { Event } from '../../src/events/event';

export class FakeChildProcessFactory{
    constructor(baseURI){
        this.childProcesses = [];
        this.childProcessCreated = new Event();
        this.baseURI = baseURI;
    }
    createChildProcess(){
        const result = new FakeChildProcess();
        this.childProcessCreated.dispatch(result);
        this.childProcesses.push(result);
        return result;
    }
}