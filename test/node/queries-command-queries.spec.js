const StateWorker = require('../../dist/state-worker');
const path = require('path');

describe('a state worker that cancels queries gracefully', () => {
    let worker;
    
    beforeAll(async () => {
        worker = await StateWorker.create({
            path: path.resolve(__dirname, './examples/calculation-example.js'),
            maxNumberOfProcesses: 3,
            gracefulQueryCancellation: true
        });
    });
    
    afterAll(() => {
        worker.terminate();
    })
    
    it('should handle a number of queries and a numer of commands and a number of queries', async () => {
        worker.initialize(1);
        const firstQueryPromise = worker.getDifferenceWith(1);
        const secondQueryPromise = worker.getDifferenceWith(2);
        const thirdQueryPromise = worker.getDifferenceWith(3);
        worker.multiplyBy(2);
        worker.multiplyBy(3);
        const fourthQueryPromise = worker.getDifferenceWith(4);
        const fifthQueryPromise = worker.getDifferenceWith(5);
        const sixthQueryPromise = worker.getDifferenceWith(6);
        
        await expect(firstQueryPromise).rejects.toThrow('execution was cancelled');
        await expect(secondQueryPromise).rejects.toThrow('execution was cancelled');
        await expect(thirdQueryPromise).rejects.toThrow('execution was cancelled');
        expect(await fourthQueryPromise).toEqual(-2);
        expect(await fifthQueryPromise).toEqual(-1);
        expect(await sixthQueryPromise).toEqual(0);
    })
})

describe('a state worker that does not cancel queries gracefully', () => {
    let worker;
    
    beforeAll(async () => {
        worker = await StateWorker.create({
            path: path.resolve(__dirname, './examples/calculation-example.js'),
            maxNumberOfProcesses: 3,
            gracefulQueryCancellation: false
        });
    });
    
    afterAll(() => {
        worker.terminate();
    })
    
    it('should handle a number of queries and a numer of commands and a number of queries', async () => {
        worker.initialize(1);
        const firstQueryPromise = worker.getDifferenceWith(1);
        const secondQueryPromise = worker.getDifferenceWith(2);
        const thirdQueryPromise = worker.getDifferenceWith(3);
        worker.multiplyBy(2);
        worker.multiplyBy(3);
        const fourthQueryPromise = worker.getDifferenceWith(4);
        const fifthQueryPromise = worker.getDifferenceWith(5);
        const sixthQueryPromise = worker.getDifferenceWith(6);
        
        await expect(firstQueryPromise).rejects.toThrow('execution was cancelled');
        await expect(secondQueryPromise).rejects.toThrow('execution was cancelled');
        await expect(thirdQueryPromise).rejects.toThrow('execution was cancelled');
        expect(await fourthQueryPromise).toEqual(-2);
        expect(await fifthQueryPromise).toEqual(-1);
        expect(await sixthQueryPromise).toEqual(0);
    })
})
        