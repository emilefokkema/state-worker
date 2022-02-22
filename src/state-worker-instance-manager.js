class StateWorkerInstanceManager{
    constructor(instanceFactory, maxNumberOfProcesses){
        this.instanceFactory = instanceFactory;
        this.maxNumberOfProcesses = maxNumberOfProcesses;
        this.instances = [];
    }
    async initialize(){
        const instance = this.instanceFactory();
        const methodCollection = await instance.initialize();
        console.log('method collection:', methodCollection)
    }
    static create(instanceFactory, config){
        return new StateWorkerInstanceManager(instanceFactory, config.maxNumberOfProcesses);
    }
}

module.exports = { StateWorkerInstanceManager };