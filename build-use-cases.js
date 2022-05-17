const path = require('path');
const fs = require('fs');

const useCasesDirName = path.resolve(__dirname, './test/use-cases');
const useCasesDistDirName = path.resolve(useCasesDirName, './dist');


if(!fs.existsSync(useCasesDistDirName)){
    fs.mkdirSync(useCasesDistDirName);
}

const useCasesDirContent = fs.readdirSync(useCasesDirName, {withFileTypes: true});
for(let entry of useCasesDirContent){
    if(entry.isDirectory() && entry.name !== 'dist'){
        const dirName = path.resolve(useCasesDirName, `./${entry.name}`);
        const distDirName = path.resolve(useCasesDistDirName, `./${entry.name}`);
        if(!fs.existsSync(distDirName)){
            fs.mkdirSync(distDirName);
        }
        const subDirContent = fs.readdirSync(dirName, {withFileTypes: true});
        for(let subDirEntry of subDirContent){
            if(subDirEntry.isFile()){
                fs.copyFileSync(path.resolve(dirName, subDirEntry.name), path.resolve(distDirName, subDirEntry.name))
            }
        }
    }
}
fs.copyFileSync(path.resolve(__dirname, './dist/state-worker.js'), path.resolve(useCasesDistDirName, 'state-worker.js'))
fs.copyFileSync(path.resolve(useCasesDirName, 'index.html'), path.resolve(useCasesDistDirName, 'index.html'))
