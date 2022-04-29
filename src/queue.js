class QueueItem{
    constructor(){
        this.previousBack = null;
        this.nextFront = null;
    }
    detach(){
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
        return nextFront;
    }
    appendToBack(item){
        const back = this.findBack();
        back.nextFront = item;
        item.previousBack = back;
    }
    findBack(){
        if(!this.nextFront){
            return this;
        }
        return this.nextFront.findBack();
    }
    accept(visitor){
        visitor = this.acceptSelf(visitor);
        if(!visitor){
            return;
        }
        if(this.nextFront !== null){
            return this.nextFront.accept(visitor);
        }
        return visitor;
    }
}

class QueueValue extends QueueItem{
    constructor(value){
        super();
        this.value = value;
    }
    acceptSelf(visitor){
        return visitor.visitValue(this);
    }
}

class FindItem{
    constructor(){
        this.result = null;
        this.queueFronts = [];
    }
    visitQueueFront(queue, front){
        this.queueFronts.push({queue, front});
        return this;
    }
    visitQueue(){
        return this;
    }
    visitValue(){
        return this;
    }
    getItemAndQueue(){
        if(!this.result){
            return {};
        }
        let queue;
        const queueFront = this.queueFronts.find(f => f.front === this.result);
        if(queueFront){
            queue = queueFront.queue;
        }
        return {item: this.result, queue}
    }
}

class FindValue extends FindItem{
    constructor(value){
        super();
        this.value = value;
    }
    visitValue(queueValue){
        if(queueValue.value === this.value){
            this.result = queueValue;
            return;
        }
        return this;
    }
}

class FindAnyValue extends FindItem{
    visitValue(queueValue){
        this.result = queueValue;
        return;
    }
}

class FindQueue extends FindItem{
    constructor(queue){
        super();
        this.queue = queue;
    }
    visitQueue(queue){
        if(queue === this.queue){
            this.result = queue;
            return;
        }
        return this;
    }
}

export class Queue extends QueueItem{
    constructor(){
        super();
        this.front = null;
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
        if(this.front === null){
            this.front = item;
        }else{
            this.front.appendToBack(item);
        }
    }
    dequeue(){
        const item = this.removeItem(new FindAnyValue());
        if(!item){
            return null;
        }
        return item.value;
    }
    removeQueue(queue){
        this.removeItem(new FindQueue(queue));
    }
    remove(value){
        this.removeItem(new FindValue(value))
    }
    findItem(findItemVisitor){
        this.accept(findItemVisitor);
        return findItemVisitor.getItemAndQueue();
    }
    removeItem(findItemVisitor){
        const {item, queue} = this.findItem(findItemVisitor);
        let newFront;
        if(item){
            newFront = item.detach();
            if(queue){
                queue.front = newFront;
            }
            return item;
        }
        return null;
    }
    empty(){
        const {item} = this.findItem(new FindAnyValue());
        return !item;
    }
    acceptSelf(visitor){
        visitor = visitor.visitQueue(this);
        if(!visitor){
            return;
        }
        if(this.front !== null){
            visitor = visitor.visitQueueFront(this, this.front);
            if(!visitor){
                return;
            }
            return this.front.accept(visitor);
        }
        return visitor;
    }
}