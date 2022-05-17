const log2 = Math.log(2);

function escapeStep(x, y, maxIt){
    let zRealNew;
    let zImagNew;
    let zReal = 0;
    let zImag = 0;
    let step = 0;
    let moduloSquare = 0;
    while(moduloSquare < 8 && step++ < maxIt){
        zRealNew = zReal * zReal - zImag * zImag + x;
        zImagNew = 2 * zReal * zImag + y;
        zReal = zRealNew;
        zImag = zImagNew;
        moduloSquare = zReal * zReal + zImag * zImag;
    }
    return {step, moduloSquare};
}

function getColor(x, y){
    const {step, moduloSquare} = escapeStep(x, y, 500);
    const normalizedStep = step + 1 - Math.log(Math.log(moduloSquare) / (2 * log2)) / log2;
    const lightness = moduloSquare < 4 ? 0 : 0.5 * (1 + Math.sin(normalizedStep / 20));
    const gray = Math.floor(255 * lightness);
    return [gray, gray, gray, 255];
}

queries = {
    getTile(left, top, size){
        const pixelWidth = this.state.pixelWidth;
        const viewboxX = this.state.viewboxLeft + pixelWidth * left;
        let x = viewboxX;
        let y = this.state.viewboxTop - pixelWidth * top;
        const array = new Uint8ClampedArray(4 * size * size);
        for(let row = 0; row < size; row++){
            x = viewboxX;
            for(let column = 0; column < size; column++){
                const startIndex = 4 * (row * size + column);
                const [r, g, b, a] = getColor(x, y);
                array[startIndex] = r;
                array[startIndex + 1] = g;
                array[startIndex + 2] = b;
                array[startIndex + 3] = a;
                x += pixelWidth;
            }
            y -= pixelWidth;
        }
        return array.buffer;
    }
};

commands = {
    initialize(viewboxLeft, viewboxTop, pixelWidth){
        this.state = this.state || {};
        this.state.viewboxLeft = viewboxLeft;
        this.state.viewboxTop = viewboxTop;
        this.state.pixelWidth = pixelWidth;
    }
};