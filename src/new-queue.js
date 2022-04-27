class QueueItem{
    constructor(value){
        this.value = value;
        this.next = null;
        this.previous = null;
    }
    enqueue(value){

    }
    dequeue(){
        
    }
}

export class NewQueue{
    constructor(){
        this.front = null;
        this.back = null;
    }
    enqueue(value){
        if(this.empty()){
            const item = new QueueItem(value);
            this.front = item;
            this.back = item;
        }else{
            this.back = this.back.enqueue(value);
        }
    }
    dequeue(){
        if(this.empty()){
            return null;
        }
        const result = this.front.value;
        this.front = this.front.dequeue();
        if(this.front === null){
            this.back = null;
        }
    }
    remove(value){

    }
    empty(){
        return this.front = null;
    }
}