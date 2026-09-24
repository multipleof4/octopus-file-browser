import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const VIRTUAL_ID = 'virtual:octopus-repo-tree';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const ignored = new Set(['.claude', '.git', '.npmrc', 'demo', 'dist', 'node_modules']);

function scan(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !ignored.has(entry.name))
    .map((entry) => {
      const path = resolve(directory, entry.name);
      const stats = statSync(path);
      return entry.isDirectory()
        ? { name: entry.name, type: 'directory', modified: stats.mtime.toISOString(), children: scan(path) }
        : { name: entry.name, type: 'file', modified: stats.mtime.toISOString(), size: stats.size };
    });
}

export default defineConfig({
  build: { outDir: 'demo' },
  plugins: [{
    name: 'octopus-demo-tree',
    resolveId(id) { return id === VIRTUAL_ID ? RESOLVED_ID : null; },
    load(id) { return id === RESOLVED_ID ? `export default ${JSON.stringify(scan(process.cwd()))}` : null; },
  }],
});
