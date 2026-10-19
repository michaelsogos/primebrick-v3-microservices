import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/**
 * Remote page chunk build — vite lib mode, ES module, self-contained.
 *
 * NO `external`: every import (svelte, @primebrick/ui) is bundled into the
 * chunk. Bare specifiers would fail in the browser (no import map) — the
 * whole point is a self-contained ESM page delivered over
 * /api/v1/module-assets/.
 */
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'jobs-page.js',
      cssFileName: 'jobs-page',
    },
  },
});
