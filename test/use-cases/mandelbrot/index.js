(function(){
    async function init(){
        const worker = await StateWorker.create({
            path: 'mandelbrot/worker.js',
            maxNumberOfProcesses: 3
        });
        const result = await worker.getSomething();
        console.log('from worker:', result)
    }

    init();
})()