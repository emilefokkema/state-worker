# StateWorker
## About
Runs an instance of something like a class across multiple processes, allowing for parallel computation. Works both in the browser and in Node.js.
## Usage
### In the browser
Suppose you have a JavaScript file called `my-state-worker-script.js` whose content looks like this:
```js
queries = {
    getDifference(y){
        return this.state.x - y;
    }
};

commands = {
    setX(value){
        this.state.x = value;
    }
};
```
Now you can create a `StateWorker` like this:
```js
// supposing we are inside a function marked `async`
const stateWorker = await StateWorker.create(
    {
        path: 'my-state-worker-script.js',
        maxNumberOfProcesses: 3
    });

// execute the command
await stateWorker.setX(4);

// logs `1`
console.log(await stateWorker.getDifference(3))
```