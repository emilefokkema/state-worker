export class Queue{
    constructor(){
        this.items = [];
    }
    enqueue(item){
        this.items.push(item);
    }
    dequeue(){
        if(this.items.length === 0){
            return null;
        }
        return this.items.shift();
    }
    remove(item){
        const index = this.items.indexOf(item);
        if(index === -1){
            return;
        }
        this.items.splice(index, 1);
    }
    empty(){
        return this.items.length === 0;
    }
}