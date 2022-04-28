class QueueItem{
    constructor(){
        this.previousBack = null;
        this.nextFront = null;
    }
    append(item){
        const nextFront = this.nextFront;
        this.nextFront = item;
        item.previousBack = this;
        if(nextFront){
            nextFront.previousBack = item;
        }
    }
    findBack(){
        if(!this.nextFront){
            return this;
        }
        return this.nextFront.findBack();
    }
}

class QueueValue extends QueueItem{
    constructor(value){
        super();
        this.value = value;
    }
    dequeueInternal(){
        const previousBack = this.previousBack;
        const nextFront = this.nextFront;
        this.previousBack = null;
        this.nextFront = null;
        if(previousBack){
            previousBack.nextFront = nextFront;
        }
        if(nextFront){
            nextFront.previousBack = previousBack;
        }
        return {front: nextFront, value: this.value};
    }
    removeInternal(value){
        if(value !== this.value){
            if(this.nextFront){
                this.nextFront.removeInternal(value);
            }
            return this;
        }
        const { front } = this.dequeueInternal();
        return front;
    }
    toString(){
        return `[queue item with value ${this.value}]`
    }
    empty(){
        return false;
    }
}
let id = 0;
export class Queue extends QueueItem{
    constructor(){
        super();
        this.front = null;
        this.back = null;
        this.id = id++;
    }
    dequeueInternal(){
        if(this.front === null){
            if(this.nextFront === null){
                return { front: this, value: null };
            }else{
                const { value } = this.nextFront.dequeueInternal();
                return { front: this, value };
            }
        }else{
            return { front: this, value: this.dequeue() }
        }
    }
    enqueueQueue(){
        const item = new Queue();
        this.enqueueItem(item);
        return item;
    }
    enqueue(value){
        this.enqueueItem(new QueueValue(value))
    }
    enqueueItem(item){
        if(this.back === null){
            this.front = item;
        }else{
            this.back.append(item);
        }
        this.back = item;
    }
    dequeue(){
        if(this.front === null){
            return null;
        }
        const { front, value } = this.front.dequeueInternal();
        this.front = front;
        if(this.front === null){
            this.back = null;
        }else{
            this.back = front.findBack();
        }
        return value;
    }
    removeInternal(value){
        this.remove(value);
        if(this.nextFront){
            this.nextFront.removeInternal(value);
        }
    }
    remove(value){
        if(this.front === null){
            return;
        }
        this.front = this.front.removeInternal(value);
        if(this.front === null){
            this.back = null;
        }else{
            this.back = this.front.findBack();
        }
    }
    empty(){
        if(this.nextFront && !this.nextFront.empty()){
            return false;
        }
        return this.front === null || this.front.empty();
    }
    toString(){
        let result = '';
        if(this.front !== null){
            result = `queue whose front is not null`
        }
        if(this.nextFront !== null){
            result = `${result} whose nextFront is not null`
        }
        return `[${result}]`
    }
}