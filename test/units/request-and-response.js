import { Event } from '../../src/events/event';
import { getNext } from '../../src/events/get-next';
import { filter } from '../../src/events/filter';
import { pipe } from '../../src/events/pipe';
import { NotifyingList } from './notifying-list';

export class RequestAndResponse{
    constructor(){
        this.request = new NotifyingList();
        this.response = new Event();
        this.latestRequestId = 0;
        this.requestSource = pipe(this.request.itemAdded, listener => ({content, respond}) => listener(content, respond))
    }
    get requestAdded(){
        return this.request.itemAdded;
    }
    addListener(listener){
        this.requestSource.addListener(listener);
    }
    removeListener(listener){
        this.requestSource.removeListener(listener);
    }
    async getResponse(request){
        const requestId = this.latestRequestId++;
        const responsePromise = getNext(filter(this.response, (_requestId) => _requestId === requestId));
        this.request.add({
            content: request,
            respond: (response) => this.response.dispatch(requestId, response)
        });
        const [_, result] = await responsePromise;
        return result;
    }
}