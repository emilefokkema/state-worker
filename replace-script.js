const { readFileSync, writeFileSync } = require('fs');
let file = readFileSync('./dist/state-worker.js', {encoding: 'utf8'});
let replacement = readFileSync('./dist/web-child-process.js', {encoding: 'utf8'});
const match = file.match(/['"`]\{\{INSERT_WEB_WORKER_SCRIPT_STRING_HERE\}\}['"`]/);
const quoteChar = match[0][0];
replacement = replacement.replace(new RegExp(`[${quoteChar}\\\\]`,"g"), '\\$&');
file = file.replace(/\{\{INSERT_WEB_WORKER_SCRIPT_STRING_HERE\}\}/, replacement);
writeFileSync('./dist/state-worker.js', file,  {encoding: 'utf8'});