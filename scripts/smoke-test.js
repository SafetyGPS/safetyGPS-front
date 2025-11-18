import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const distFile = resolve(process.cwd(), 'dist', 'index.html');
const requiredSnippets = ['SafetyGPS', '<div id="root">'];

if (!existsSync(distFile)) {
  console.error(`[smoke] Missing build artifact: ${distFile}`);
  process.exit(1);
}

const html = readFileSync(distFile, 'utf8');
const missingSnippets = requiredSnippets.filter((snippet) => !html.includes(snippet));

if (missingSnippets.length > 0) {
  console.error('[smoke] Built index.html is missing expected text:', missingSnippets);
  process.exit(1);
}

console.log('[smoke] Build output looks healthy.');
