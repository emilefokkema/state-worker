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
    toString(){
        let result = this.selfToString();
        if(!this.nextFront){
            return result;
        }
        return `${result} --> ${this.nextFront.toString()}`
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
    selfToString(){
        return `{${this.value}}`;
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
    embedQueue(){
        return new EmbeddedQueue(this);
    }
    useAsFallbackFor(other){
        return new QueueWithFallback(other, this);
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
        return !!this.removeItem(new FindValue(value))
    }
    contains(value){
        const {item} = this.findItem(new FindValue(value));
        return !!item;
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
    peek(){
        const {item} = this.findItem(new FindAnyValue());
        if(!item){
            return null;
        }
        return item.value;
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
    selfToString(){
        return `[${(this.front ? this.front.toString() : '')}]`
    }
}

class QueueWithFallbackBack{
    constructor(queueBack){
        this.queueBack = queueBack;
    }
    enqueue(value){
        this.queueBack.enqueue(value);
    }
    enqueueQueue(){
        const subQueueBack = this.queueBack.enqueueQueue();
        return new QueueWithFallbackBack(subQueueBack);
    }
    remove(value){
        this.queueBack.remove(value);
    }
    removeQueue(queue){
        this.queueBack.removeQueue(queue.queueBack);
    }
}

class QueueWithFallback{
    constructor(queue, fallback){
        this.queue = queue;
        this.queueBack = new QueueWithFallbackBack(this.queue);
        this.fallback = fallback;
    }
    enqueueQueue(){
        return this.queueBack.enqueueQueue();
    }
    remove(value){
        this.queueBack.remove(value);
    }
    removeQueue(queue){
        this.queueBack.removeQueue(queue);
    }
    enqueue(value){
        this.queueBack.enqueue(value);
    }
    dequeue(){
        if(this.queue.empty()){
            return this.fallback.dequeue();
        }
        return this.queue.dequeue();
    }
    empty(){
        return this.queue.empty() && this.fallback.empty();
    }
}

class EmbeddedQueueBack{
    constructor(queueBack, baseQueueBack){
        this.queueBack = queueBack;
        this.baseQueueBack = baseQueueBack;
    }
    enqueue(value){
        this.baseQueueBack.enqueue(value);
        this.queueBack.enqueue(value);
    }
    enqueueQueue(){
        const baseSubQueue = this.baseQueueBack.enqueueQueue();
        const subQueue = this.queueBack.enqueueQueue();
        return new EmbeddedQueueBack(subQueue, baseSubQueue);
    }
    remove(value){
        this.queueBack.remove(value);
        this.baseQueueBack.remove(value);
    }
    removeQueue(queue){
        this.queueBack.removeQueue(queue.queueBack);
        this.baseQueueBack.removeQueue(queue.baseQueueBack);
    }
}

class EmbeddedQueue {
    constructor(baseQueue){
        this.baseQueue = baseQueue;
        this.queue = new Queue();
        this.queueBack = new EmbeddedQueueBack(this.queue, this.baseQueue);
    }
    enqueueQueue(){
        return this.queueBack.enqueueQueue();
    }
    remove(value){
        this.queueBack.remove(value);
    }
    removeQueue(queue){
        this.queueBack.removeQueue(queue);
    }
    enqueue(value){
        this.queueBack.enqueue(value);
    }
    prune(){
        while(!this.queue.empty() && !this.baseQueue.contains(this.queue.peek())){
            this.queue.dequeue();
        }
    }
    dequeue(){
        this.prune();
        if(this.queue.empty()){
            return null;
        }
        const value = this.queue.dequeue();
        this.baseQueue.remove(value);
        return value;
    }
    empty(){
        this.prune();
        return this.queue.empty();
    }
    toString(){
        return `base: ${this.baseQueue.toString()}\r\nqueue: ${this.queue.toString()}`
    }
}