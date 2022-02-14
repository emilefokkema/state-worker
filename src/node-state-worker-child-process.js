console.log('hello world from the child process')
process.on('message', (m) => {
    console.log(`got a message!`, m)
});