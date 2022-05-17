(function(){
    class Tile{
        constructor(left, top, size){
            this.left = left;
            this.top = top;
            this.size = size;
        }
        async draw(context, worker){
            const buffer = await worker.getTile(this.left, this.top, this.size);
            const array = new Uint8ClampedArray(buffer);
            const imageData = new ImageData(array, this.size, this.size);
            context.putImageData(imageData, this.left, this.top);
        }
    }
    function getTiles(width, height, size){
        const verticalNumber = Math.ceil(height / size);
        const horizontalNumber = Math.ceil(width / size);
        const result = [];
        let left = 0;
        let top = 0;
        for(let rowIndex = 0; rowIndex < verticalNumber; rowIndex++){
            left = 0;
            for(let columnIndex = 0; columnIndex < horizontalNumber; columnIndex++){
                result.push(new Tile(left, top, size));
                left += size;
            }
            top += size;
        }
        return result;
    }
    async function init(){
        const canvasElement = document.getElementById('canvas');
        const context = canvasElement.getContext('2d');
        const canvasWidth = canvasElement.width;
        const canvasHeight = canvasElement.height;
        const ratio = canvasHeight / canvasWidth;

        

        const tiles = getTiles(canvasWidth, canvasHeight, 50);

        const worker = await StateWorker.create({
            path: 'mandelbrot/worker.js',
            maxNumberOfProcesses: 3
        });

        let viewboxLeft = -1;
        let viewboxWidth = 2;
        let viewboxTop = ratio;
        await worker.initialize(viewboxLeft, viewboxTop, viewboxWidth / canvasWidth);
        draw();

        function draw(){
            for(let tile of tiles){
                tile.draw(context, worker);
            }
        }
    }

    init();
})()