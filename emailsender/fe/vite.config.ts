import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  resolveVendorSpecifier,
  specifierTopPackage,
  VENDOR_SPECIFIERS,
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
 * `dist/emailsender-pages.deps.json` records which vendor specifiers the
 * chunk actually imports — the manifest the host handshakes against its
 * own vendor-manifest.json before mounting.
 */
const usedVendorDeps = new Set<string>();

function vendorPlane(): Plugin {
  return {
    name: 'primebrick-vendor-plane',
    enforce: 'pre',
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
      // Emit gate: the emitted chunk may only carry allowlisted bare
      // specifiers — anything else would fail import-map resolution in the
      // host. Catches bad `external` config too, not just source imports.
      const allowed = new Set<string>(VENDOR_SPECIFIERS);
      const bare = /(?:from|import)\s*["']([^"'.:/][^"']*)["']/g;
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        for (const m of chunk.code.matchAll(bare)) {
          const spec = m[1];
          if (!spec.startsWith('@') && spec.startsWith('node:')) continue;
          if (!allowed.has(spec)) {
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
    name: 'emailsender-pages-css-stub',
    closeBundle() {
      const file = fileURLToPath(new URL('./dist/emailsender-pages.css', import.meta.url));
      if (!existsSync(file)) {
        writeFileSync(file, '/* emailsender-pages: no extracted styles */\n');
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
  const wrapped = UI_VENDOR_MAP[specifier];
  if (wrapped) return pkgVersionAt(uiRoot, wrapped);
  return pkgVersionAt(serviceRoot, specifierTopPackage(specifier));
}

/** Emit the shared_deps manifest the host verifies before mounting. */
function depsManifest(): Plugin {
  return {
    name: 'primebrick-deps-manifest',
    closeBundle() {
      const file = fileURLToPath(new URL('./dist/emailsender-pages.deps.json', import.meta.url));
      const manifest: RemoteDepsManifest = {
        vendor_requires: Object.fromEntries(
          [...usedVendorDeps].sort().map((s) => [s, specifierVersion(s)])
        ),
      };
      writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
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
      fileName: () => 'emailsender-pages.js',
      cssFileName: 'emailsender-pages',
    },
  },
});
