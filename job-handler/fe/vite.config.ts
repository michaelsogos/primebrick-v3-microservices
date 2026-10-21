import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Remote page chunk build — vite lib mode, ES module, self-contained.
 *
 * NO `external`: every import (svelte, @primebrick/ui) is bundled into the
 * chunk. Bare specifiers would fail in the browser (no import map) — the
 * whole point is a self-contained ESM page delivered over
 * /api/v1/module-assets/.
 */
/**
 * The host remote-loader always probes `<chunk>.css` alongside the chunk —
 * emit an empty stub when no CSS is extracted so the probe is a silent 200
 * instead of a 404 noise line in dev tools.
 */
function stylesheetStub(): Plugin {
  return {
    name: 'jobs-page-css-stub',
    closeBundle() {
      const file = fileURLToPath(new URL('./dist/jobs-page.css', import.meta.url));
      if (!existsSync(file)) {
        writeFileSync(file, '/* jobs-page: no extracted styles */\n');
      }
    },
  };
}

export default defineConfig({
  plugins: [svelte(), stylesheetStub()],
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
