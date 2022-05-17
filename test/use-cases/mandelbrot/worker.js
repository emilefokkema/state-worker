queries = {
    getTile(left, top, size){

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