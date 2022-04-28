import { Queue } from '../../src/queue';

describe('a queue', () => {

    it('should enqueue and dequeue', () => {
        const queue = new Queue();
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);

        expect(queue.empty()).toBe(false);
        expect([
            queue.dequeue(),
            queue.dequeue(),
            queue.dequeue()
        ]).toEqual([1, 2, 3])
        expect(queue.empty()).toBe(true);

        queue.enqueue(4);
        queue.enqueue(5);
        queue.enqueue(6);
        expect([
            queue.dequeue(),
            queue.dequeue(),
            queue.dequeue()
        ]).toEqual([4, 5, 6])
    });

    it('should remove', () => {
        const queue = new Queue();
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3)
        queue.enqueue(4)
        queue.enqueue(5)

        queue.remove(1);
        queue.remove(3);
        queue.remove(5);
        queue.enqueue(6);

        expect([
            queue.dequeue(),
            queue.dequeue(),
            queue.dequeue()
        ]).toEqual([2, 4, 6]);
        expect(queue.empty()).toBe(true);

        queue.enqueue(7);
        queue.remove(7);
        expect(queue.empty()).toBe(true);
    });

    it('should be able to contain subqueues', () => {
        const queue = new Queue();
        queue.enqueue(1);
        const subQueue = queue.enqueueQueue();
        queue.enqueue(3);
        subQueue.enqueue(2);

        expect([
            queue.dequeue(),
            queue.dequeue(),
            queue.dequeue()
        ]).toEqual([1, 2, 3]);
        expect(queue.empty()).toBe(true);
    });

    it('should remove from subqueues', () => {
        const queue = new Queue();
        queue.enqueue(1);
        const firstSubQueue = queue.enqueueQueue();
        const secondSubQueue = queue.enqueueQueue();
        queue.enqueue(4);
        secondSubQueue.enqueue(3);
        firstSubQueue.enqueue(2);
        queue.enqueue(5);

        queue.remove(3);
        queue.remove(5);

        expect([
            queue.dequeue(),
            queue.dequeue(),
            queue.dequeue()
        ]).toEqual([1, 2, 4]);
    });

    it('should remove single item', () => {
        const queue = new Queue();
        queue.enqueue(1);
        queue.remove(1);
        queue.enqueue(2);

        expect(queue.dequeue()).toEqual(2);
        expect(queue.empty()).toBe(true);
    });

    it('should return empty correctly', () => {
        const queue = new Queue();
        const subQueue = queue.enqueueQueue();
        queue.enqueue(2);

        expect(queue.empty()).toBe(false);
        expect(queue.dequeue()).toEqual(2);
        expect(queue.empty()).toBe(true);

        subQueue.enqueue(1);

        expect(queue.empty()).toBe(false);
        expect(queue.dequeue()).toEqual(1);
        expect(queue.empty()).toBe(true);
    });

    it('should keep subqueues in order', () => {
        const queue = new Queue();
        queue.enqueue(1);
        const firstSubQueue = queue.enqueueQueue();
        const secondSubQueue = queue.enqueueQueue();
        queue.enqueue(4);
        secondSubQueue.enqueue(3);
        firstSubQueue.enqueue(2);

        expect([
            queue.dequeue(),
            queue.dequeue(),
            queue.dequeue(),
            queue.dequeue()
        ]).toEqual([1, 2, 3, 4]);
        expect(queue.empty()).toBe(true);
        queue.enqueue(7);
        secondSubQueue.enqueue(6);
        firstSubQueue.enqueue(5);

        expect([
            queue.dequeue(),
            queue.dequeue(),
            queue.dequeue()
        ]).toEqual([5, 6, 7]);
    })

    it('should remove a subqueue', () => {
        const queue = new Queue();
        const subQueue1 = queue.enqueueQueue();
        queue.enqueue(2);
        const subQueue2 = queue.enqueueQueue();
        queue.enqueue(4);
        subQueue1.enqueue(1);
        subQueue2.enqueue(3);
        
        expect([
            queue.dequeue(),
            queue.dequeue(),
            queue.dequeue(),
            queue.dequeue()
        ]).toEqual([1, 2, 3, 4])
        
        queue.removeQueue(subQueue1);
        
        subQueue1.enqueue(1);
        subQueue2.enqueue(2);
        
        expect(queue.dequeue()).toEqual(2);
        
        queue.removeQueue(subQueue2);
        
        subQueue2.enqueue(1);
        queue.enqueue(2);
        
        expect(queue.dequeue()).toEqual(2);
    });
});