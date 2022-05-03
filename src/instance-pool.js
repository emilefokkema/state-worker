import { Queue } from './queue';
import { RequestAndResponseQueue } from './request-and-response-queue';


class InstanceRecord{
    constructor(instance, idleRequestQueue, idleResponseQueue){
        this.instance = instance;
        this.idleRequestResponseQueue = new RequestAndResponseQueue(idleRequestQueue, idleResponseQueue);
    }
    get idle(){
        return this.idleRequestResponseQueue.hasResponse();
    }
    terminate(){
        this.instance.terminate();
    }
    whenIdle(cancellationToken){
        return this.idleRequestResponseQueue.getResponse(cancellationToken);
    }
    setIdle(){
        this.idleRequestResponseQueue.addResponse(this.instance);
    }
}

export class InstancePool{
    constructor(){
        this.instanceRecords = [];
        this.idleInstanceRequestQueue = new Queue();
        this.idleInstanceResponseQueue = new Queue();
        this.idleInstanceRequestResponseQueue = new RequestAndResponseQueue(this.idleInstanceRequestQueue, this.idleInstanceResponseQueue);
    }
    terminate(){
        for(let instanceRecord of this.instanceRecords){
            instanceRecord.terminate();
        }
    }
    terminateInstance(instance){
        instance.terminate();
        let index = this.instanceRecords.findIndex(r => r.instance === instance);
        if(index > -1){
            this.instanceRecords.splice(index, 1);
        }
    }
    count(){
        return this.instanceRecords.length;
    }
    idleCount(){
        return this.instanceRecords.filter(r => r.idle).length;
    }
    async whenInstanceIsIdle(instance, cancellationToken, descriptionFn){
        const record = this.instanceRecords.find(r => r.instance === instance);
        return record.whenIdle(cancellationToken, descriptionFn);
    }
    async getIdleInstance(cancellationToken){
        return await this.idleInstanceRequestResponseQueue.getResponse(cancellationToken);
    }
    async whenAllInstancesIdle(cancellationToken){
        const records = this.instanceRecords.slice();
        const result = records.map(r => r.instance);
        await Promise.all(records.map(r => r.whenIdle(cancellationToken)));
        return result;
    }
    releaseIdleInstance(instance){
        const record = this.instanceRecords.find(r => r.instance === instance);
        record.setIdle();
    }
    registerInstance(instance){
        const idleRequestQueue = this.idleInstanceRequestQueue.useAsFallbackFor(new Queue());
        const idleResponseQueue = this.idleInstanceResponseQueue.embedQueue();
        this.instanceRecords.push(new InstanceRecord(instance, idleRequestQueue, idleResponseQueue));
    }
}