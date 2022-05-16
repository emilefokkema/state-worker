import { Queue } from '../../src/queue';

describe('an embedded queue', () => {

    it('should add to the base queue', () => {
        const baseQueue = new Queue();
        const embeddedQueue = baseQueue.embedQueue();

        baseQueue.enqueue(1);
        embeddedQueue.enqueue(2);

        expect([
            baseQueue.dequeue(),
            baseQueue.dequeue()
        ]).toEqual([1, 2])
    });

    it('should dequeue from the base queue', () => {
        const baseQueue = new Queue();
        const embeddedQueue = baseQueue.embedQueue();

        baseQueue.enqueue(1);
        embeddedQueue.enqueue(2);
        baseQueue.enqueue(3);
        embeddedQueue.enqueue(4);

        expect(embeddedQueue.dequeue()).toEqual(2);
        expect([
            baseQueue.dequeue(),
            baseQueue.dequeue(),
            baseQueue.dequeue()
        ]).toEqual([1, 3, 4]);
    });

    it('should remove from the base queue', () => {
        const baseQueue = new Queue();
        const embeddedQueue = baseQueue.embedQueue();

        embeddedQueue.enqueue(1);
        embeddedQueue.enqueue(2);
        embeddedQueue.enqueue(3);
        embeddedQueue.remove(2);

        expect([
            baseQueue.dequeue(),
            baseQueue.dequeue()
        ]).toEqual([1, 3]);
        expect(baseQueue.empty()).toBe(true);
    });

    it('should be removed from by the base queue', () => {
        const baseQueue = new Queue();
        const embeddedQueue = baseQueue.embedQueue();

        embeddedQueue.enqueue(1);
        embeddedQueue.enqueue(2);
        embeddedQueue.enqueue(3);
        baseQueue.remove(2);

        expect([
            embeddedQueue.dequeue(),
            embeddedQueue.dequeue()
        ]).toEqual([1, 3]);
        expect(embeddedQueue.empty()).toBe(true);
    });

    it('should be dequeued from by base queue', () => {
        const baseQueue = new Queue();
        const embeddedQueue = baseQueue.embedQueue();

        baseQueue.enqueue(1);
        embeddedQueue.enqueue(2);
        baseQueue.enqueue(3);
        embeddedQueue.enqueue(4);

        expect([
            baseQueue.dequeue(),
            baseQueue.dequeue()
        ]).toEqual([1, 2]);
        expect(embeddedQueue.dequeue()).toEqual(4);
        expect(baseQueue.dequeue()).toEqual(3);
        expect(baseQueue.empty()).toBe(true);
    });

    it('should report empty', () => {
        const baseQueue = new Queue();
        const embeddedQueue = baseQueue.embedQueue();
        
        embeddedQueue.enqueue(1);
        embeddedQueue.enqueue(2);
        baseQueue.enqueue(3);
        
        expect([
            baseQueue.dequeue(),
            baseQueue.dequeue(),
        ]).toEqual([1, 2]);
        expect(embeddedQueue.empty()).toBe(true);
    })

    it('should dequeue from embedded subqueues through the main queue', () => {
        const baseQueue = new Queue();
        const embeddedQueue = baseQueue.embedQueue();
        baseQueue.enqueue(1);
        embeddedQueue.enqueue(2);
        const embeddedSubqueue = embeddedQueue.enqueueQueue();
        baseQueue.enqueue(3);
        embeddedQueue.enqueue(4);
        embeddedSubqueue.enqueue(5);

        expect([
            baseQueue.dequeue(),
            baseQueue.dequeue(),
            baseQueue.dequeue(),
            baseQueue.dequeue(),
            baseQueue.dequeue()
        ]).toEqual([1, 2, 5, 3, 4]);
        expect(embeddedQueue.empty()).toBe(true);
    });

    it('should dequeue from embedded subqueues through the embedded queue', () => {
        const baseQueue = new Queue();
        const embeddedQueue = baseQueue.embedQueue();
        baseQueue.enqueue(1);
        embeddedQueue.enqueue(2);
        const embeddedSubqueue = embeddedQueue.enqueueQueue();
        baseQueue.enqueue(3);
        embeddedQueue.enqueue(4);
        embeddedSubqueue.enqueue(5);

        expect([
            embeddedQueue.dequeue(),
            embeddedQueue.dequeue(),
            embeddedQueue.dequeue()
        ]).toEqual([2, 5, 4]);
        expect(embeddedQueue.empty()).toBe(true);
        expect([
            baseQueue.dequeue(),
            baseQueue.dequeue()
        ]).toEqual([1, 3]);
        expect(baseQueue.empty()).toBe(true);
    });

    it('should support removing an embedded subqueue', () => {
        const baseQueue = new Queue();
        const embeddedQueue = baseQueue.embedQueue();

        baseQueue.enqueue(1);
        embeddedQueue.enqueue(2);
        const embeddedSubQueue = embeddedQueue.enqueueQueue();
        embeddedQueue.enqueue(3);
        embeddedSubQueue.enqueue(4);

        expect([
            baseQueue.dequeue(),
            baseQueue.dequeue(),
            baseQueue.dequeue(),
            baseQueue.dequeue()
        ]).toEqual([1, 2, 4, 3])
        expect(baseQueue.empty()).toBe(true);
        expect(embeddedQueue.empty()).toBe(true);

        embeddedSubQueue.enqueue(5);
        expect(baseQueue.empty()).toBe(false);
        expect(embeddedQueue.empty()).toBe(false);
        expect(baseQueue.dequeue()).toBe(5);
        expect(baseQueue.empty()).toBe(true);
        expect(embeddedQueue.empty()).toBe(true);

        embeddedQueue.removeQueue(embeddedSubQueue);
        embeddedSubQueue.enqueue(5);
        expect(baseQueue.empty()).toBe(true);
        expect(embeddedQueue.empty()).toBe(true);
    });
});