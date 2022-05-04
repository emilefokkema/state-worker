import { Queue } from './queue';
import { RequestAndResponseQueue } from './request-and-response-queue';

class IdleRequestQueue{
    constructor(requestAndResponseQueue){
        this.requestAndResponseQueue = requestAndResponseQueue;
    }
    whenIdle(cancellationToken){
        return this.requestAndResponseQueue.getResponse(cancellationToken);
    }
    enqueueIdleRequestQueue(){
        const subRequestAndResponseQueue = this.requestAndResponseQueue.enqueueRequestQueue();
        return new IdleRequestQueue(subRequestAndResponseQueue);
    }
    removeIdleRequestQueue(queue){
        this.requestAndResponseQueue.removeRequestQueue(queue.requestAndResponseQueue);
    }
}
class InstanceRecord{
    constructor(instance, idleRequestQueue, idleResponseQueue){
        this.instance = instance;
        this.idleRequestResponseQueue = new RequestAndResponseQueue(idleRequestQueue, idleResponseQueue);
        this.idleRequestQueue = new IdleRequestQueue(this.idleRequestResponseQueue);
        instance.onIdle.addListener(() => {
            this.setIdle();
        });
    }
    get idle(){
        return this.idleRequestResponseQueue.hasResponse();
    }
    get onIdleRequested(){
        return this.instance.onIdleRequested;
    }
    performExecution(execution){
        return this.instance.performExecution(execution);
    }
    whenStarted(){
        return this.instance.whenStarted();
    }
    setState(state){
        return this.instance.setState(state);
    }
    initialize(config, baseURI, state){
        return this.instance.initialize(config, baseURI, state);
    }
    terminate(){
        this.instance.terminate();
    }
    enqueueIdleRequestQueue(){
        return this.idleRequestQueue.enqueueIdleRequestQueue();
    }
    removeIdleRequestQueue(queue){
        this.idleRequestQueue.removeIdleRequestQueue(queue);
    }
    whenIdle(cancellationToken){
        return this.idleRequestQueue.whenIdle(cancellationToken);
    }
    setIdle(){
        this.idleRequestResponseQueue.addResponse(this);
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
        let index = this.instanceRecords.findIndex(r => r === instance);
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
    async getIdleInstance(cancellationToken){
        return await this.idleInstanceRequestResponseQueue.getResponse(cancellationToken);
    }
    async whenAllInstancesIdle(cancellationToken){
        const records = this.instanceRecords.slice();
        await Promise.all(records.map(r => r.whenIdle(cancellationToken)));
        return records;
    }
    registerInstance(instance){
        const idleRequestQueue = this.idleInstanceRequestQueue.useAsFallbackFor(new Queue());
        const idleResponseQueue = this.idleInstanceResponseQueue.embedQueue();
        const record = new InstanceRecord(instance, idleRequestQueue, idleResponseQueue);
        this.instanceRecords.push(record);
        return record;
    }
}