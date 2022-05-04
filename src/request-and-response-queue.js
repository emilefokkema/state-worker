class RequestQueueBack{
    constructor(requestQueue, responseQueue){
        this.requestQueue = requestQueue;
        this.responseQueue = responseQueue;
    }
    enqueueRequestQueue(){
        const requestSubQueue = this.requestQueue.enqueueQueue();
        return new RequestQueueBack(requestSubQueue, this.responseQueue);
    }
    removeRequestQueue(queue){
        this.requestQueue.removeQueue(queue.requestQueue);
    }
    hasResponse(){
        return !this.responseQueue.empty();
    }
    async getResponse(cancellationToken){
        if(!this.responseQueue.empty()){
            return this.responseQueue.dequeue();
        }
        return await new Promise((resolve) => {
            const request = {resolve};
            this.requestQueue.enqueue(request);
            if(cancellationToken){
                cancellationToken.addListener(() => {
                    this.requestQueue.remove(request);
                })
            }
        });
    }
}

export class RequestAndResponseQueue{
    constructor(requestQueue, responseQueue){
        this.requestQueue = requestQueue;
        this.responseQueue = responseQueue;
        this.requestQueueBack = new RequestQueueBack(this.requestQueue, this.responseQueue);
    }
    enqueueRequestQueue(){
        return this.requestQueueBack.enqueueRequestQueue();
    }
    removeRequestQueue(queue){
        this.requestQueueBack.removeRequestQueue(queue);
    }
    hasResponse(){
        return this.requestQueueBack.hasResponse();
    }
    getResponse(cancellationToken){
        return this.requestQueueBack.getResponse(cancellationToken);
    }
    addResponse(response){
        if(!this.requestQueue.empty()){
            this.requestQueue.dequeue().resolve(response);
            return;
        }
        this.responseQueue.enqueue(response);
    }
}