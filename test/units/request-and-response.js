import { Event } from '../../src/events/event';
import { getNext } from '../../src/events/get-next';
import { filter } from '../../src/events/filter';
import { NotifyingList } from './notifying-list';

export class RequestAndResponse{
    constructor(){
        this.request = new NotifyingList();
        this.response = new Event();
        this.latestRequestId = 0;
    }
    get requestAdded(){
        return this.request.itemAdded;
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