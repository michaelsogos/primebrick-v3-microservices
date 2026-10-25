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
 * Remote page chunk build — vite lib mode, ES module.
 *
 * Vendor plane: bare imports for allowlisted specifiers (svelte,
 * @primebrick/ui, …) stay BARE in the emitted chunk and resolve at runtime
 * through the host's document import map → ONE shared, versioned instance
 * per vendor package. A specifier inside a vendor package but outside the
 * allowlist is a build error (it would create a second runtime copy). Leaf
 * deps keep bundling inside the chunk — no instance semantics.
 *
 * `dist/jobs-page.deps.json` records which vendor specifiers the chunk
 * actually imports — the manifest the host handshakes against its own
 * vendor-manifest.json before mounting.
 */
const usedVendorDeps = new Set<string>();

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
    generateBundle(_options, bundle) {
      // Emit gate: the emitted chunk may only carry vendor-external bare
      // specifiers — anything else would fail import-map resolution in the
      // host. Catches bad `external` config too, not just source imports.
      const bare = /(?:from|import)\s*["']([^"'.:/][^"']*)["']/g;
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        for (const m of chunk.code.matchAll(bare)) {
          const spec = m[1];
          if (!spec.startsWith('@') && spec.startsWith('node:')) continue;
          if (resolveVendorSpecifier(spec) !== 'external') {
            throw new Error(
              `[vendor-plane] emitted chunk contains non-allowlisted bare ` +
                `specifier "${spec}" — the host import map cannot resolve it.`
            );
          }
        }
      }
    },
  };
}

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

/** Emit the shared_deps manifest the host verifies before mounting. */
function depsManifest(): Plugin {
  return {
    name: 'primebrick-deps-manifest',
    closeBundle() {
      const file = fileURLToPath(new URL('./dist/jobs-page.deps.json', import.meta.url));
      const manifest: RemoteDepsManifest = {
        vendor_requires: Object.fromEntries(
          [...usedVendorDeps].sort().map((s) => [s, specifierVersion(s)])
        ),
      };
      writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
      // Content-addressed sibling — the host loader keys its module cache
      // on this hash and verifies bytes before the blob: import. Emitted
      // alongside the chunk so rebuilds ship hash and bytes together.
      const chunk = fileURLToPath(new URL('./dist/jobs-page.js', import.meta.url));
      writeFileSync(
        chunk.replace(/\.js$/, '.sha256'),
        createHash('sha256').update(readFileSync(chunk)).digest('hex') + '\n',
      );
    },
  };
}

export default defineConfig({
  plugins: [vendorPlane(), svelte(), stylesheetStub(), depsManifest()],
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
