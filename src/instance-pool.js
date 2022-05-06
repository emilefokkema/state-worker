import { Queue } from './queue';
import { RequestAndResponseQueue } from './request-and-response-queue';
import { pipe } from './events/pipe';

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
        this.terminated = false;
        this.idleRequestResponseQueue = new RequestAndResponseQueue(idleRequestQueue, idleResponseQueue);
        this.idleRequestQueue = new IdleRequestQueue(this.idleRequestResponseQueue);
        instance.onIdle.addListener(() => {
            if(!this.idleAllowed){
                return;
            }
            this.setIdle();
        });
        this.idleAllowed = true;
        this.onIdleRequested = pipe(instance.onIdleRequested, listener => ({executionId}, sendResponse) => {
            if(!this.idleAllowed){
                sendResponse();
                return;
            }
            listener({executionId}, sendResponse);
        });
    }
    get idle(){
        return this.idleRequestResponseQueue.hasResponse();
    }
    allowIdle(value){
        this.idleAllowed = value;
    }
    performExecution(execution){
        if(this.terminated){
            return new Promise(() => {});
        }
        return this.instance.performExecution(execution);
    }
    whenStarted(){
        if(this.terminated){
            return new Promise(() => {});
        }
        return this.instance.whenStarted();
    }
    setState(state){
        if(this.terminated){
            return new Promise(() => {});
        }
        return this.instance.setState(state);
    }
    initialize(config, baseURI, state){
        if(this.terminated){
            return new Promise(() => {});
        }
        return this.instance.initialize(config, baseURI, state);
    }
    terminate(){
        this.instance.terminate();
        this.terminated = true;
    }
    enqueueIdleRequestQueue(){
        return this.idleRequestQueue.enqueueIdleRequestQueue();
    }
    removeIdleRequestQueue(queue){
        this.idleRequestQueue.removeIdleRequestQueue(queue);
    }
    whenIdle(cancellationToken){
        if(this.terminated){
            return new Promise(() => {});
        }
        return this.idleRequestQueue.whenIdle(cancellationToken);
    }
    setIdle(){
        if(this.terminated){
            return;
        }
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
    terminateAllInstancesExcept(instances){
        const instancesToTerminate = this.instanceRecords.filter(r => !instances.includes(r));
        for(const instanceToTerminate of instancesToTerminate){
            this.terminateInstance(instanceToTerminate);
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
    async getAtLeastOneIdleInstanceAndTerminateNonIdleOnes(cancellationToken){
        const alreadyIdleInstances = [];
        const promisesToRace = [];
        const instancesThatBecameIdleLater = [];
        for(const instance of this.instanceRecords){
            const alreadyIdle = instance.idle;
            if(alreadyIdle){
                alreadyIdleInstances.push(instance);
            }
            promisesToRace.push(instance.whenIdle(cancellationToken).then(() => {
                if(!alreadyIdleInstances.includes(instance)){
                    instancesThatBecameIdleLater.push(instance);
                }
                //return instance
            }));
        }
        if(alreadyIdleInstances.length > 0){
            console.log(`${alreadyIdleInstances.length} instance(s) is/are already idle. terminating others and returning`)
            this.terminateAllInstancesExcept(alreadyIdleInstances);
            return alreadyIdleInstances;
        }else{
            console.log('no instance is idle yet. waiting for one to become idle...')
            await Promise.race(promisesToRace);
            console.log(`${instancesThatBecameIdleLater.length} instance(s) has/have become idle. terminating others. (total is ${this.instanceRecords.length})`)
            const result = instancesThatBecameIdleLater;
            this.terminateAllInstancesExcept(result);
            return result;
        }
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