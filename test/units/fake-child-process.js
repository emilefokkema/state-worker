import { Event } from '../../src/event';

export class FakeChildProcess{
    constructor(){
        this.messageSent = new Event();
        this.messageReceived = new Event();
    }
    sendMessageFromChildProcess(msg){
        this.messageSent.dispatch(msg);
    }
    addMessageEventListener(listener){
        this.messageSent.addListener(listener);
    }
    removeMessageEventListener(listener){
        this.messageSent.removeListener(listener);
    }
    sendMessage(msg){
        this.messageReceived.dispatch(msg);
    }
    terminate(){}
}