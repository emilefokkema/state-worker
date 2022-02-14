class StateWorkerInstanceManager{
    constructor(instanceFactory, maxNumberOfProcesses){
        this.instanceFactory = instanceFactory;
        this.maxNumberOfProcesses = maxNumberOfProcesses;
        this.instances = [];
    }
    async initialize(){
        const instance = this.instanceFactory();
        const result = await instance.initialize();
    }
    static create(instanceFactory, config){
        return new StateWorkerInstanceManager(instanceFactory, config.maxNumberOfProcesses);
    }
}

module.exports = { StateWorkerInstanceManager };