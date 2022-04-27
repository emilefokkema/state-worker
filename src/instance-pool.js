import { Queue } from './queue';

export class InstancePool{
    constructor(){
        this.instances = [];
        this.idleInstances = [];
        this.idleInstanceRequests = new Queue();
        this.instanceIdleRequests = [];
    }
    terminate(){
        for(let instance of this.instances){
            instance.terminate();
        }
    }
    count(){
        return this.instances.length;
    }
    idleCount(){
        return this.idleInstances.length;
    }
    async whenInstanceIsIdle(instance, cancellationToken){
        const index = this.idleInstances.indexOf(instance);
        if(index > -1){
            this.idleInstances.splice(index, 1);
            return;
        }
        await new Promise((resolve) => {
            this.enqueueInstanceIdleRequest(instance, {resolve}, cancellationToken);
        });
    }
    async getIdleInstance(cancellationToken){
        if(this.idleInstances.length > 0){
            return this.idleInstances.shift();
        }
        return await new Promise((resolve) => {
            this.enqueueIdleInstanceRequest({resolve}, cancellationToken);
        });
    }
    async whenAllInstancesIdle(cancellationToken){
        const result = this.instances.slice();
        await Promise.all(result.map(i => this.whenInstanceIsIdle(i, cancellationToken)));
        return result;
    }
    releaseIdleInstance(instance){
        const idleRequest = this.dequeueInstanceIdleRequest(instance);
        if(idleRequest){
            idleRequest.resolve();
            return;
        }
        const idleInstanceRequest = this.idleInstanceRequests.dequeue();
        if(idleInstanceRequest){
            idleInstanceRequest.resolve(instance);
            return;
        }
        this.idleInstances.push(instance);
    }
    addInstance(instance){
        this.instances.push(instance);
        this.releaseIdleInstance(instance);
    }


    enqueueIdleInstanceRequest(request, cancellationToken){
        this.idleInstanceRequests.enqueue(request);
        if(cancellationToken){
            cancellationToken.addListener(() => {
                this.idleInstanceRequests.remove(request);
            });
        }
    }
    enqueueInstanceIdleRequest(instance, request, cancellationToken){
        let record = this.instanceIdleRequests.find(r => r.instance === instance);
        if(!record){
            record = {instance, queue: new Queue()};
            this.instanceIdleRequests.push(record);
        }
        const queue = record.queue;
        queue.enqueue(request);
        if(cancellationToken){
            cancellationToken.addListener(() => {
                const index = this.instanceIdleRequests.indexOf(record);
                if(index === -1){
                    return;
                }
                queue.remove(request);
                if(queue.empty()){
                    this.instanceIdleRequests.splice(index, 1);
                }
            });
        }
    }
    dequeueInstanceIdleRequest(instance){
        const index = this.instanceIdleRequests.findIndex(record => record.instance === instance);
        if(index === -1){
            return null;
        }
        const queue = this.instanceIdleRequests[index].queue;
        const request = queue.dequeue();
        if(queue.empty()){
            this.instanceIdleRequests.splice(index, 1);
        }
        return request;
    }
}