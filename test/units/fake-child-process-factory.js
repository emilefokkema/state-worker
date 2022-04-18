import { FakeChildProcess } from "./fake-child-process";
import { Event } from '../../src/events/event';

export class FakeChildProcessFactory{
    constructor(baseURI){
        this.childProcessCreated = new Event();
        this.baseURI = baseURI || 'http://base.uri';
    }
    createChildProcess(){
        const result = new FakeChildProcess();
        this.childProcessCreated.dispatch(result);
        return result;
    }
}