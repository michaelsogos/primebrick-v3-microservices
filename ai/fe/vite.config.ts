import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  resolveVendorSpecifier,
  rewriteLucideBarrelImports,
  specifierTopPackage,
  type RemoteDepsManifest,
} from '@primebrick/sdk';

/**
 * Remote module chunk build — vite lib mode, ES modules, TWO entries:
 *   - `ai-sheets` → remote sheet panels (`nav.sheets[]`, mounted by the
 *     host sheet engine inside host chrome)
 *   - `ai-pages`  → remote pages (`nav.routes[]`, mounted by RemotePageMount)
 * Separate entries = parallel background downloads — the host warms both
 * after the module census, so sheets/pages mount instantly on request.
 *
 * Vendor plane: bare imports for allowlisted specifiers (svelte,
 * @primebrick/ui, …) stay BARE in the emitted chunk and resolve at runtime
 * through the host's document import map → ONE shared, versioned instance
 * per vendor package. A specifier inside a vendor package but outside the
 * allowlist is a build error (it would create a second runtime copy). Leaf
 * deps keep bundling inside the chunk — no instance semantics.
 *
 * `dist/<entry>.deps.json` records which vendor specifiers THAT chunk
 * actually imports — derived from the emitted code, so each chunk declares
 * exactly its own requirements. The host handshakes each manifest against
 * its vendor-manifest.json before mounting.
 */
function vendorPlane(): Plugin {
  return {
    name: 'primebrick-vendor-plane',
    enforce: 'pre',
    /**
     * Decompose `@primebrick/ui/vendor/lucide` named imports into per-icon
     * specifiers BEFORE resolution — a chunk pays for the icons it uses,
     * never for the barrel catalog. Every emitted icon is validated
     * against ui's @lucide/svelte dist: a typo is a build error, not a
     * 404 at remote-load time.
     */
    transform(code) {
      if (!code.includes('@primebrick/ui/vendor/lucide')) return null;
      const { code: out, icon_specifiers } = rewriteLucideBarrelImports(code);
      for (const specifier of icon_specifiers) {
        const file = specifier.slice(specifier.lastIndexOf('/') + 1);
        if (!existsSync(join(uiRoot, 'node_modules/@lucide/svelte/dist/icons', file))) {
          throw new Error(
            `[vendor-plane] lucide icon "${file}" has no dist file in ` +
              `@lucide/svelte — typo or stale vendor-map version`
          );
        }
      }
      return { code: out, map: null };
    },
    resolveId(source, importer) {
      if (source.startsWith('.') || source.startsWith('/') || source.includes(':')) {
        return null;
      }
      switch (resolveVendorSpecifier(source)) {
        case 'external':
          if (importer) usedVendorDeps.add(source);
          return { id: source, external: true };
        case 'reject':
          throw new Error(
            `[vendor-plane] "${source}" is inside a vendor package but is NOT ` +
              `an allowlisted specifier — importing it would create a second ` +
              `runtime copy. Use an allowlisted specifier instead.`
          );
        default:
          return null;
      }
    },
  };
}
const usedVendorDeps = new Set<string>();

/**
 * Per-chunk deps manifest + emit gate — each emitted chunk is scanned for
 * bare specifiers; allowlisted ones become its `vendor_requires`, anything
 * else is a build error (it would fail import-map resolution in the host).
 */
function depsManifest(): Plugin {
  const bare = /(?:from|import)\s*["']([^"'.:/][^"']*)["']/g;
  return {
    name: 'primebrick-deps-manifest',
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        const specs = new Set<string>();
        for (const m of chunk.code.matchAll(bare)) {
          const spec = m[1];
          if (spec.startsWith('node:')) continue;
          if (resolveVendorSpecifier(spec) !== 'external') {
            throw new Error(
              `[vendor-plane] emitted chunk contains non-allowlisted bare ` +
                `specifier "${spec}" — the host import map cannot resolve it.`
            );
          }
          specs.add(spec);
        }
        if (!chunk.isEntry) continue;
        const manifest: RemoteDepsManifest = {
          vendor_requires: Object.fromEntries(
            [...specs].sort().map((s) => [s, specifierVersion(s)])
          ),
        };
        this.emitFile({
          type: 'asset',
          fileName: chunk.fileName.replace(/\.js$/, '.deps.json'),
          source: JSON.stringify(manifest, null, 2) + '\n',
        });
        // Content-addressed sibling — the host loader keys its module
        // cache on this hash and verifies bytes before the blob: import.
        // Emitted alongside the chunk so a rebuild always ships hash and
        // bytes together (a registry-pinned integrity could go stale).
        this.emitFile({
          type: 'asset',
          fileName: chunk.fileName.replace(/\.js$/, '.sha256'),
          source: createHash('sha256').update(chunk.code).digest('hex') + '\n',
        });
      }
    },
  };
}

/**
 * The host remote-loader always probes `<chunk>.css` alongside the chunk —
 * emit an empty stub per entry when no CSS is extracted so the probe is a
 * silent 200 instead of a 404 noise line in dev tools.
 */
function stylesheetStub(): Plugin {
  return {
    name: 'ai-chunk-css-stub',
    closeBundle() {
      for (const name of ['ai-sheets', 'ai-pages']) {
        const file = fileURLToPath(new URL(`./dist/${name}.css`, import.meta.url));
        if (!existsSync(file)) {
          writeFileSync(file, `/* ${name}: no extracted styles */\n`);
        }
      }
    },
  };
}

/** Version of a package as resolved from a node_modules dir. */
function pkgVersionAt(dir: string, pkg: string): string {
  const pj = join(dir, 'node_modules', pkg, 'package.json');
  const parsed = JSON.parse(readFileSync(pj, 'utf8')) as { version?: string };
  if (!parsed.version) throw new Error(`deps-manifest: no version for ${pkg}`);
  return parsed.version;
}

/**
 * Version truth per specifier — must equal the host manifest's rule.
 * `@primebrick/ui/vendor/*` specifiers wrap a real package declared in
 * ui's published `vendor-map.json`; the version that matters is the one
 * inside ui's own node_modules (that's what the vendored bundle was
 * compiled against — the service's graph may not even carry the package).
 */
const serviceRoot = fileURLToPath(new URL('..', import.meta.url));
const uiRoot = join(serviceRoot, 'node_modules', '@primebrick/ui');
const UI_VENDOR_MAP = JSON.parse(
  readFileSync(join(uiRoot, 'vendor-map.json'), 'utf8'),
) as Record<string, string>;

function specifierVersion(specifier: string): string {
  // Longest-prefix match — per-icon specifiers
  // (`@primebrick/ui/vendor/lucide/icons/cpu.js`) inherit the wrapped
  // package version of their wrapper's specifier key.
  const wrappedKey = Object.keys(UI_VENDOR_MAP)
    .filter((k) => specifier === k || specifier.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0];
  if (wrappedKey) return pkgVersionAt(uiRoot, UI_VENDOR_MAP[wrappedKey]);
  return pkgVersionAt(serviceRoot, specifierTopPackage(specifier));
}

export default defineConfig({
  plugins: [vendorPlane(), svelte(), stylesheetStub(), depsManifest()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: {
        'ai-sheets': 'src/index.ts',
        'ai-pages': 'src/pages.ts',
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
  },
});
