(function(){
    class Tile{
        constructor(left, top, size){
            this.left = left;
            this.top = top;
            this.size = size;
        }
        async draw(context, worker){
            try{
                const buffer = await worker.getTile(this.left, this.top, this.size);
                const array = new Uint8ClampedArray(buffer);
                const imageData = new ImageData(array, this.size, this.size);
                context.putImageData(imageData, this.left, this.top);
            }catch(e){

            }
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
    function isNearEdge(x, y, width, height, edgeWidth){
        return x < edgeWidth || y < edgeWidth || height - y < edgeWidth || width - x < edgeWidth;
    }
    async function init(){
        const canvasElement = document.getElementById('canvas');
        const canvasRect = canvasElement.getBoundingClientRect();
        const canvasWidth = Math.floor(canvasRect.width) * devicePixelRatio;
        const canvasHeight = Math.floor(canvasRect.height) * devicePixelRatio;
        canvasElement.width = canvasWidth;
        canvasElement.height = canvasHeight;
        const context = canvasElement.getContext('2d');
        const ratio = canvasHeight / canvasWidth;
        const zoomEdgeWidth = 20;
        const zoomFactor = 2;

        const tiles = getTiles(canvasWidth, canvasHeight, 50);

        const worker = await StateWorker.create({
            path: 'mandelbrot/worker.js',
            maxNumberOfProcesses: 5,
            gracefulQueryCancellation: true
        });

        let viewboxLeft = -1;
        let viewboxWidth = 2;
        let viewboxTop = ratio;
        canvasElement.addEventListener('click', (e) => {
            const canvasRectX = e.clientX - canvasRect.x;
            const canvasRectY = e.clientY - canvasRect.y;
            const nearEdge = isNearEdge(canvasRectX, canvasRectY, canvasRect.width, canvasRect.height, zoomEdgeWidth);
            const viewboxCanvasRatio = viewboxWidth / canvasRect.width;
            const viewboxX = viewboxLeft + canvasRectX * viewboxCanvasRatio;
            const viewboxY = viewboxTop - canvasRectY * viewboxCanvasRatio;
            if(nearEdge){
                zoomOut();
            }else{
                zoomIn(viewboxX, viewboxY);
            }
        });
        canvasElement.addEventListener('mousemove', (e) => {
            const canvasRectX = e.clientX - canvasRect.x;
            const canvasRectY = e.clientY - canvasRect.y;
            const nearEdge = isNearEdge(canvasRectX, canvasRectY, canvasRect.width, canvasRect.height, zoomEdgeWidth);
            if(nearEdge && !canvasElement.classList.contains('mouse-edge')){
                canvasElement.classList.add('mouse-edge')
            }else if(!nearEdge && canvasElement.classList.contains('mouse-edge')){
                canvasElement.classList.remove('mouse-edge');
            }
        });

        await worker.initialize(viewboxLeft, viewboxTop, viewboxWidth / canvasWidth);
        draw();
        function zoomIn(x, y){
            viewboxLeft = x - (x - viewboxLeft) / zoomFactor;
            viewboxTop = y + (viewboxTop - y) / zoomFactor;
            viewboxWidth = viewboxWidth / zoomFactor;
            worker.initialize(viewboxLeft, viewboxTop, viewboxWidth / canvasWidth);
            draw();
        }
        function zoomOut(){
            viewboxLeft = viewboxLeft + viewboxWidth * (1 - zoomFactor) / 2;
            viewboxTop = viewboxTop + viewboxWidth * ratio * (zoomFactor - 1) / 2;
            viewboxWidth = viewboxWidth * zoomFactor;
            worker.initialize(viewboxLeft, viewboxTop, viewboxWidth / canvasWidth);
            draw();
        }
        function draw(){
            for(let tile of tiles){
                tile.draw(context, worker);
            }
        }
    }

    init();
})()