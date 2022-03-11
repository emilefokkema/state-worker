import { ProcessMessageEventSource } from './process-message-event-source';
import { filter } from './filter';
import { getNext } from './get-next';


export class RequestTarget{
    constructor(process){
        this.process = process;
        this.processResponseMessage = filter(new ProcessMessageEventSource(process), ({type}) => type === 'response');
        this.latestRequestId = 0;
    }
    async getResponse(request){
        const requestId = this.latestRequestId++;
        const responsePromise = getNext(filter(this.processResponseMessage, ({requestId: _requestId}) => _requestId === requestId));
        this.process.sendMessage({
            type: 'request',
            requestId,
            request
        });
        const  [{response}] = await responsePromise;
        return response;
    }
}