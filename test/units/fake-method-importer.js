export class FakeMethodImporter{
    constructor(result){
        this.result = result;
    }
    importMethods(){
        return Promise.resolve(this.result);
    }
}