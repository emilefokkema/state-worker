import { ProcessMessageEventSource } from './events/process-message-event-source';
import { RequestTarget } from './events/request-target';
import { RequestSource } from './events/request-source';
import { filter } from './events/filter';
import { getNext } from './events/get-next';

class ChildProcessWrapper{
    constructor(childProcess){
        this.childProcess = childProcess;
        const childProcessMessage = new ProcessMessageEventSource(childProcess);
        this.startedMessage = filter(childProcessMessage, ({type}) => type === 'started');
        this.onIdle = filter(childProcessMessage, ({type}) => type === 'idle');
        this.requestTarget = new RequestTarget(childProcess);
        const requestSource = new RequestSource(childProcess);
        this.onIdleRequested = filter(requestSource, ({type}) => type === 'requestIdle');
        this.hasStarted = false;
        getNext(this.startedMessage).then(() => {this.hasStarted = true;});
    }
    terminate(){
        this.childProcess.terminate();
    }
    async whenStarted(){
        await new Promise(res => setTimeout(res, 0))
        if(this.hasStarted){
            return;
        }
        return getNext(this.startedMessage);
    }
    setState(state){
        return this.requestTarget.getResponse({type: 'setState', state});
    }
    performExecution(execution){
        return this.requestTarget.getResponse({type: 'execution', methodName: execution.methodName, args: execution.args, id: execution.id});
    }
    initialize(config, baseURI, state){
        return this.requestTarget.getResponse({type: 'initialize', config, baseURI, state});
    }
}

export function wrapChildProcess(process){
    return new ChildProcessWrapper(process);
}