import { ProcessMessageEventSource } from './events/process-message-event-source';
import { RequestTarget } from './events/request-target';
import { filter } from './events/filter';
import { getNext } from './events/get-next';

class ChildProcessWrapper{
    constructor(childProcess){
        this.childProcess = childProcess;
        const childProcessMessage = new ProcessMessageEventSource(childProcess);
        this.startedMessage = filter(childProcessMessage, ({type}) => type === 'started');
        this.requestTarget = new RequestTarget(childProcess);
    }
    terminate(){
        this.childProcess.terminate();
    }
    whenStarted(){
        return getNext(this.startedMessage);
    }
    getState(){
        return this.requestTarget.getResponse({type: 'state'});
    }
    performExecution(execution){
        return this.requestTarget.getResponse({type: 'execution', methodName: execution.methodName, args: execution.args});
    }
    initialize(config, baseURI, state){
        return this.requestTarget.getResponse({type: 'initialize', config, baseURI, state});
    }
}

export function wrapChildProcess(process){
    return new ChildProcessWrapper(process);
}