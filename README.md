# StateWorker
[![npm version](https://badge.fury.io/js/state-worker.svg)](https://badge.fury.io/js/state-worker)
## About
Runs an instance[^1] across multiple processes, allowing for parallel computation. Works both in the browser and in Node.js.
## Queries and commands
Define methods that change the state (commands) and others that do not (queries). Two different queries can be run at the same time, whereas two different commands cannot.
## Usage
### In the browser
Suppose you have a file called `my-state-worker-script.js` whose content looks something like this:
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

### In Node.js

Exactly the same, except that the script now has to export the commands and the queries in a commonjs way:
```js
const commands = { /* the methods that should be treated like commmands */ };
const queries = { /* the methods that should be treated like queries */ };
module.exports = { commands, queries };
```

## Testing

There are three test scripts: `test-units`, `test-node` and `test-web`. The first runs unit tests. The second relies on `state-worker.js` having been built and put in the `dist` folder (by running `build` or `build-dev`) and then tests it in an actual Node environment, creating child processes and everything. The third also relies on the build result in the `dist` folder, but then uses Karma to run `StateWorker` in an actual browser, where it (i.e. `StateWorker`) will create Workers. The fourth test script, `test`, runs `test-units`, then builds `StateWorker` and finally runs the second and third scripts.

## API

### Methods

#### StateWorker.Create

`StateWorker.create(config)`

- config ([Config](#config))
- returns: a `Promise` that will resolve to an instance of a [`StateWorker`](#stateworker) (or reject).

### Types

#### Config

Properties:

- `maxNumberOfProcesses` (number): the maximum number of processes (web workers in the browser, worker threads in Node) that will be created
- `path` (string): the path to the file that contains the definitions of the methods (queries and commands). In the browser, this path should either be relative to the document's baseURI, or absolute. In a Node context, it should be absolute.
- `module` (boolean): in the context of a browser, signifies whether the script should be loaded into the web worker as a module [^2]
- `gracefulQueryCancellation`: if `StateWorker` is currently running a query on some instance, but a command is waiting to be executed (which will always cause any running query to reject), and if this property is set to `false`, this means that `StateWorker` will not wait for the instance that is running the query to become idle, but will simply terminate the instance in question, so as to be able to begin execution of the command sooner. If `gracefulQueryCancellation` is not set, or it is set to `true`, an instance that is currently running a query that was already cancelled because of a command will not be terminated, but will be allowed to become idle before the command is run.

#### StateWorker

Methods:

- `terminate()`: terminates all child processes and causes all running queries or commands to reject

In addition to `terminate`, an instance of `StateWorker` will have a method for each command and for each query that is defined in the script. Each of these methods will return a `Promise`.

#### `this` in the methods

A method in the `StateWorker` script may reference `this`. `this` will have the following methods:

`await(promise)`

- `promise` (object): if it really is a `Promise`, the current instance (web worker, worker script, whatever the case may be) will tell the `StateWorker` that it is now free to do something else (run another query, perhaps) as long as `promise` has not resolved yet.
- returns: a `Promise` that will resolve once `promise` has resolved and the current instance is not doing anything else

Example:

```js
queries = {
    async longRunningQuery(){
        // ... do work here, and then:
        const promise = /* some task that will complete in the future */
        // now this instance is free to do something else until `promise` resolves, so we release it:
        const result = await this.await(promise);
        // and now `promise` has resolved and `result` is its result
    }
};
```

[^1]: Of what, you ask? It has state like a class and it has methods like a class, so it might as well be called a class.
[^2]: [See](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker) the `type` property of the `options` parameter of the `Worker` constructor.