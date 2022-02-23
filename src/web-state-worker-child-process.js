import { WebMethodImporter } from './web-method-importer';
import { WebParentProcess } from './web-parent-process';
import { start } from './child-process';

const importer = new WebMethodImporter();
const parentProcess = new WebParentProcess();

start(importer, parentProcess);