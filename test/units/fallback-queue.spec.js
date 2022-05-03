import { Queue } from '../../src/queue';

describe('a queue with fallback', () => {

    it('should dequeue from self first and fallback later', () => {
        const fallbackQueue = new Queue();
        const queue = new Queue();
        const result = fallbackQueue.useAsFallbackFor(queue);

        fallbackQueue.enqueue(1);
        queue.enqueue(2);

        expect([
            result.dequeue(),
            result.dequeue()
        ]).toEqual([2, 1]);
    });

    it('should work together with embedded queues', () => {
        const mainQueue = new Queue();
        const threesQueue = mainQueue.useAsFallbackFor(mainQueue.embedQueue());
        const fivesQueue = mainQueue.useAsFallbackFor(mainQueue.embedQueue());

        mainQueue.enqueue(2);
        expect(threesQueue.dequeue()).toBe(2);
        mainQueue.enqueue(4);
        expect(fivesQueue.dequeue()).toBe(4);

        mainQueue.enqueue(8);
        mainQueue.enqueue(16);
        threesQueue.enqueue(3);
        threesQueue.enqueue(9);
        fivesQueue.enqueue(5);
        threesQueue.remove(3);
        expect(fivesQueue.dequeue()).toBe(5);
        expect(threesQueue.dequeue()).toBe(9);
        expect(threesQueue.dequeue()).toBe(8);
        expect(fivesQueue.dequeue()).toBe(16);
    });
});