export class InstanceCreation{
    constructor(){
        this.started = false;
        this.cancelled = false;
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