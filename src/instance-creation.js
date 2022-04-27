import { CancellationToken } from './events/cancellation-token';

export class InstanceCreation{
    constructor(instance){
        this.cancellationToken = new CancellationToken();
        this.instance = instance;
    }
    get cancelled(){
        return this.cancellationToken.cancelled;
    }
    onCancelled(listener){
        this.cancellationToken.addListener(listener);
    }
    cancel(){
        this.cancellationToken.cancel();
    }
}