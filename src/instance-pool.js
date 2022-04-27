import { Event } from './events/event';
import { IdleInstanceRequest } from './idle-instance-request';
import { getNext } from './events/get-next';
import { filter } from './events/filter';

export class InstancePool{
    constructor(){
        this.instances = [];
        this.availableInstances = [];
        this.pendingIdleInstanceRequests = [];
        this.idleInstanceResponse = new Event();
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
        return this.availableInstances.length;
    }
    async getSpecificIdleInstance(instance, cancellationToken){
        const index = this.availableInstances.indexOf(instance);
        if(index > -1){
            this.availableInstances.splice(index, 1);
            return;
        }
        
        const idleInstanceRequest = new IdleInstanceRequest(instance);
        const responsePromise = getNext(filter(this.idleInstanceResponse, (_request) => _request === idleInstanceRequest));
        this.pendingIdleInstanceRequests.push(idleInstanceRequest);
        getNext(cancellationToken).then(() => {
            const index = this.pendingIdleInstanceRequests.indexOf(idleInstanceRequest);
            if(index > -1){
                this.pendingIdleInstanceRequests.splice(index, 1);
            }
        });
        await responsePromise;
    }
    async getIdleInstance(cancellationToken){
        if(this.availableInstances.length > 0){
            const [instance] = this.availableInstances.splice(0, 1);
            return instance;
        }
        
        const idleInstanceRequest = new IdleInstanceRequest();
        const responsePromise = getNext(filter(this.idleInstanceResponse, (_request) => _request === idleInstanceRequest));
        this.pendingIdleInstanceRequests.push(idleInstanceRequest);
        let instance;
        getNext(cancellationToken).then(() => {
            const index = this.pendingIdleInstanceRequests.indexOf(idleInstanceRequest);
            if(index > -1){
                this.pendingIdleInstanceRequests.splice(index, 1);
            }
        });
        [, instance] = await responsePromise;
        return instance;
    }
    async whenAllInstancesIdle(cancellationToken){
        const result = this.instances.slice();
        await Promise.all(result.map(i => this.getSpecificIdleInstance(i, cancellationToken)));
        return result;
    }
    releaseIdleInstance(instance){
        let index = this.pendingIdleInstanceRequests.findIndex(r => r.specificInstance === instance);
        if(index === -1){
            index = this.pendingIdleInstanceRequests.findIndex(r => !r.specificInstance);
        }
        if(index > -1){
            const [request] = this.pendingIdleInstanceRequests.splice(index, 1);
            this.idleInstanceResponse.dispatch(request, instance);
            return;
        }
        this.availableInstances.push(instance);
    }
    addInstance(instance){
        this.instances.push(instance);
        this.releaseIdleInstance(instance);
    }
}