import { FakeParentProcess } from './fake-parent-process';
import { FakeMethodImporter } from './fake-method-importer';
import { Event } from '../../src/events/event';
import { start } from '../../src/child-process';
import { getNext } from '../../src/events/get-next';

describe('given a child process', () => {
    const initialState = 0;
    let parentProcess;
    const asyncQueryPromiseResolves = new Event();
    const asyncQueryPromiseRejects = new Event();

    beforeAll(async () => {
        parentProcess = new FakeParentProcess();
        const startedPromise = getNext(parentProcess.started);
        const methodImporter = new FakeMethodImporter({commands: {}, queries: {
            async getSumAsync(x){
                return this.state + x + await this.await(createAsyncQueryPromise());
            }
        }});
        start(methodImporter, parentProcess);
        await startedPromise;
        await parentProcess.initialize({config: {}, baseURI: 'http://base.uri', state: initialState})
    });

    describe('and we begin to execute an async query', () => {
        let asyncQueryResultPromise;
        let childProcessIdlePromise;

        beforeAll(() => {
            childProcessIdlePromise = getNext(parentProcess.idle);
            asyncQueryResultPromise = parentProcess.execute({methodName: 'getSumAsync', args: [1]});
        });

        it('the child process should have notified of being idle', async () => {
            await childProcessIdlePromise;
        });

        describe('and the query promise resolves', () => {
            let onceAgainIdleRequest;

            beforeAll(async () => {
                asyncQueryPromiseResolves.dispatch(2);
                onceAgainIdleRequest = await parentProcess.idleRequest.request.getOrWaitForItem();
            });

            it('the child process should have requested to be considered idle again', () => {
                expect(onceAgainIdleRequest).toBeTruthy();
            });

            describe('and then the child process is considered idle again', () => {

                beforeAll(() => {
                    onceAgainIdleRequest.respond();
                });

                it('the execution should resolve', async () => {
                    expect(await asyncQueryResultPromise).toEqual({result: 3});
                });
            });
        });
    });

    describe('and we begin to execute another async query', () => {
        let asyncQueryResultPromise;

        beforeAll(async () => {
            const childProcessIdlePromise = getNext(parentProcess.idle);
            asyncQueryResultPromise = parentProcess.execute({methodName: 'getSumAsync', args: [2]});
            await childProcessIdlePromise;
        });

        describe('and then the query promise rejects', () => {
            const error = 'Something went wrong';
            let onceAgainIdleRequest;

            beforeAll(async () => {
                asyncQueryPromiseRejects.dispatch(error);
                onceAgainIdleRequest = await parentProcess.idleRequest.request.getOrWaitForItem();
            });

            it('the child process should have requested to be considered idle again', () => {
                expect(onceAgainIdleRequest).toBeTruthy();
            });

            describe('and then the child process is considered idle again', () => {

                beforeAll(() => {
                    onceAgainIdleRequest.respond();
                });

                it('the execution should return an error', async () => {
                    expect(await asyncQueryResultPromise).toEqual({error})
                });
            });
        });
    });

    async function createAsyncQueryPromise(){
        return Promise.race([
            createAsyncQueryPromiseRejection(),
            createAsyncQueryPromiseResolution()]);
    }

    async function createAsyncQueryPromiseRejection(){
        const [error] = await getNext(asyncQueryPromiseRejects);
        throw error;
    }

    async function createAsyncQueryPromiseResolution(){
        const [result] = await getNext(asyncQueryPromiseResolves);
        return result;
    }
});