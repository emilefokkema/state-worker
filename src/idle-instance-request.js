export class IdleInstanceRequest{
    constructor(specificInstance, executionId){
        this.specificInstance = specificInstance;
        this.executionId = executionId;
    }
    toString(){
        return `[${(this.specificInstance ? `instance ${this.specificInstance.id}`: '')}${(this.executionId !== undefined ? ` execution ${this.executionId}`:'')}]`
    }
}