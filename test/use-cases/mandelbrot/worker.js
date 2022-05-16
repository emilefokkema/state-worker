queries = {
    getTile({x, y, width, height}){

    },
    getSomething(){
        return 5;
    }
};

commands = {
    setViewbox(viewbox){
        (this.state || (this.state = {})).viewbox = viewbox;
    },
    setSize(size){
        (this.state || (this.state = {})).size = size;
    }
};