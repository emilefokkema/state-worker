export class RequestAndResponseQueue{
    constructor(requestQueue, responseQueue){
        this.requestQueue = requestQueue;
        this.responseQueue = responseQueue;
    }
    hasRequest(){
        return !this.requestQueue.empty();
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
    addResponse(response){
        if(!this.requestQueue.empty()){
            this.requestQueue.dequeue().resolve(response);
            return;
        }
        this.responseQueue.enqueue(response);
    }
}