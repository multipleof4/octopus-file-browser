import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/octopus-file-browser.js'),
      fileName: (format) => format === 'es' ? 'octopus-file-browser.js' : 'octopus-file-browser.umd.cjs',
      formats: ['es', 'umd'],
      name: 'OctopusFileBrowser',
    },
    outDir: 'dist',
  },
});
