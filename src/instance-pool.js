import { Queue } from './queue';

class RequestQueue{
    constructor(){
        this.queue = new Queue();
    }
    sendRequest(cancellationToken){
        return new Promise((resolve) => {
            const request = {resolve};
            this.queue.enqueue(request);
            if(cancellationToken){
                cancellationToken.addListener(() => {
                    this.queue.remove(request);
                })
            }
        });
    }
    resolveRequest(response){
        if(this.queue.empty()){
            return false;
        }
        this.queue.dequeue().resolve(response);
        return true;
    }
}
class InstanceRecord{
    constructor(instance){
        this.instance = instance;
        this.idleRequestQueue = new RequestQueue();
        this.idle = false;
    }
    terminate(){
        this.instance.terminate();
    }
    async whenIdle(cancellationToken){
        if(this.idle){
            this.idle = false;
            return;
        }
        await this.idleRequestQueue.sendRequest(cancellationToken);
    }
    setIdle(){
        if(this.idleRequestQueue.resolveRequest()){
            return;
        }
        this.idle = true;
    }
}

export class InstancePool{
    constructor(){
        this.instanceRecords = [];
        this.instances = [];
        this.idleInstances = [];
        this.idleInstanceRequests = new Queue();
        this.idleInstanceRequestQueue = new RequestQueue();
        this.instanceIdleRequests = [];
    }
    terminate(){
        // for(let instanceRecord of this.instanceRecords){
        //     instanceRecord.terminate();
        // }
        for(let instance of this.instances){
            instance.terminate();
        }
    }
    terminateInstance(instance){
        instance.terminate();
        let index = this.instances.indexOf(instance);
        if(index > -1){
            this.instances.splice(index, 1);
        }
        index = this.idleInstances.indexOf(instance);
        if(index > -1){
            this.idleInstances.splice(index, 1);
        }
        index = this.instanceRecords.findIndex(r => r.instance === instance);
        if(index > -1){
            this.instanceRecords.splice(index, 1);
        }
    }
    count(){
        //return this.instanceRecords.length;
        return this.instances.length;
    }
    idleCount(){
        //return this.instanceRecords.filter(r => r.idle).length;
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
        
        return await this.idleInstanceRequestQueue.sendRequest(cancellationToken);
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
        if(this.idleInstanceRequestQueue.resolveRequest(instance)){
            return;
        }
        this.idleInstances.push(instance);
    }
    registerInstance(instance){
        this.instanceRecords.push(new InstanceRecord(instance));
        this.instances.push(instance);
    }
    addInstance(instance){
        this.instanceRecords.push(new InstanceRecord(instance));
        this.instances.push(instance);
        this.releaseIdleInstance(instance);
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