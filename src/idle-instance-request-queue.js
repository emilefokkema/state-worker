import { IdleInstanceRequest } from './idle-instance-request';

export class IdleInstanceRequestQueue{
    constructor(){
        this.requests = [];
        
    }
    enqueue(specificInstance, executionId){
        const request = new IdleInstanceRequest(specificInstance, executionId);
        this.requests.push(request);
        return request;
    }
    dequeueForInstance(instance){
        return this.dequeueFirst(i => i.specificInstance === instance) || this.dequeueFirst(i => !i.specificInstance);
    }
    dequeueFirst(predicate){
        const index = this.requests.findIndex(predicate);
        if(index === -1){
            return null;
        }
        const [request] = this.requests.splice(index, 1);
        return request;
    }
    remove(request){
        this.dequeueFirst(r => r === request);
    }
}