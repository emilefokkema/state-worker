(function(){
    class Tile{
        constructor(left, top, size){
            this.left = left;
            this.top = top;
            this.size = size;
        }
        async draw(context, worker){

        }
    }
    function getTiles(width, height, size){

    }
    async function init(){
        const canvasElement = document.getElementById('canvas');
        const context = canvasElement.getContext('2d');
        const canvasWidth = canvasElement.width;
        const canvasHeight = canvasElement.height;
        const ratio = canvasHeight / canvasWidth;

        let viewboxLeft = -1;
        let viewboxWidth = 2;
        let viewboxTop = ratio;

        const tiles = getTiles(canvasWidth, canvasHeight, 10);

        const worker = await StateWorker.create({
            path: 'mandelbrot/worker.js',
            maxNumberOfProcesses: 3
        });
        await worker.initialize(viewboxLeft, viewboxTop, viewboxWidth / canvasWidth);
    }

    init();
})()