import { Event } from '../../src/events/event';
import { getNext } from '../../src/events/get-next';
import { filter } from '../../src/events/filter';
import { pipe } from '../../src/events/pipe';

export class NotifyingList{
    constructor(){
        this.items = [];
        this.internalItemAdded = new Event();
        this.itemAdded = pipe(this.internalItemAdded, listener => (item) => {
            this.removeItem(item);
            listener(item);
        });
    }
    get length(){
        return this.items.length;
    }
    removeItem(item){
        const index = this.items.indexOf(item);
        if(index === -1){
            return;
        }
        this.items.splice(index, 1);
    }
    getAll(){
        return this.items.splice(0, this.items.length);
    }
    add(item){
        this.items.push(item);
        this.internalItemAdded.dispatch(item);
    }
    async whenNoneAdded(timeout){
        if(this.items.length > 0){
            throw new Error('did not expect an item to be added, but one was');
        }
        let added = false;
        const listener = () => {
            added = true;
            this.itemAdded.removeListener(listener);
        };
        return await new Promise((res, rej) => {
            this.itemAdded.addListener(listener);
            setTimeout(() => {
                this.itemAdded.removeListener(listener);
                if(added){
                    rej(new Error('did not expect an item to be added, but one was'))
                }else{
                    res();
                }
            }, timeout);
        });
    }
    async getOrWaitForItem(predicate){
        const matchingItemIndex = this.items.findIndex(i => !predicate || predicate(i));
        if(matchingItemIndex > -1){
            const [matchingItem] = this.items.splice(matchingItemIndex, 1);
            return matchingItem;
        }
        if(!predicate){
            const [result] =  await getNext(this.itemAdded);
            return result;
        }
        const [result] = await getNext(filter(this.itemAdded, predicate));;
        return result;
    }
    async getOrWaitForNumberOfItems(number, predicate){
        const result = [];
        while(result.length < number){
            result.push(await this.getOrWaitForItem(predicate));
        }
        return result;
    }
}