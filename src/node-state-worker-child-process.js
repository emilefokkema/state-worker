import { NodeMethodImporter } from './node-method-importer';
import { NodeParentProcess } from './node-parent-process';
import { start } from './child-process';

const importer = new NodeMethodImporter();
const parentProcess = new NodeParentProcess();

start(importer, parentProcess);