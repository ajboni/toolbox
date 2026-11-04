import { rememberTool } from './recentTools';

const path = document.body.dataset.toolPath;

if (path) rememberTool(path);
