import { NodeMethodImporter } from './method-importer';
import { NodeParentProcess } from './parent-process';
import { start } from '../child-process';

const importer = new NodeMethodImporter();
const parentProcess = new NodeParentProcess();

start(importer, parentProcess);