export class InstanceCreation{
    constructor(){
        this.started = false;
        this.cancelled = false;
    }
    cancel(){
        this.cancelled = true;
    }
    canStart(){
        return !this.started && !this.cancelled;
    }
    canFinish(){
        return !this.cancelled;
    }
    start(){
        this.started = true;
    }
}