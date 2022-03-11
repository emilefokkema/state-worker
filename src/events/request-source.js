import { ProcessMessageEventSource } from './process-message-event-source';
import { filter } from './filter';
import { pipe } from './pipe';

export class RequestSource{
    constructor(process){
        this.process = process;
        this.processRequestMessage = pipe(
            filter(new ProcessMessageEventSource(process), ({type}) => type === 'request'),
            listener => ({requestId, request}) => {
                listener(request, (response) => {
                    this.process.sendMessage({
                        type: 'response',
                        requestId,
                        response
                    })
                });
            }
            );
    }
    addListener(listener){
        this.processRequestMessage.addListener(listener);        
    }
    removeListener(listener){
       this.processRequestMessage.removeListener(listener);
    }
}