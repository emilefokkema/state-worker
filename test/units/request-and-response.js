import { Event } from '../../src/events/event';
import { getNext } from '../../src/events/get-next';
import { filter } from '../../src/events/filter'

export class RequestAndResponse{
    constructor(){
        this.request = new Event();
        this.response = new Event();
        this.latestRequestId = 0;
    }
    async getResponse(request){
        const requestId = this.latestRequestId++;
        const responsePromise = getNext(filter(this.response, (_requestId) => _requestId === requestId));
        this.request.dispatch({
            content: request,
            respond: (response) => this.response.dispatch(requestId, response)
        });
        const [_, result] = await responsePromise;
        return result;
    }
}