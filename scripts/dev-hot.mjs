#!/usr/bin/env node
/**
 * dev-hot — dev supervisor for US microservices.
 *
 * Runs `bun --conditions=development --hot src/index.ts` with cwd = the
 * service dir (so `.env`, `db-meta`, and every `process.cwd()` path keep
 * resolving), and watches the workspace lib SOURCES that bun cannot see:
 * `bun --hot` only watches the project directory, while the packages'
 * `development` export condition resolves @primebrick/{sdk,dal-pg,core}
 * into the sibling repos' src trees — outside every service root.
 *
 * A change under a lib src/ respawns the service (bun boots in ~1s).
 * Service-local edits are still handled by `--hot` itself.
 */
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const LIBS = ['primebrick-v3-sdk', 'primebrick-dal-v3', 'primebrick-v3-core', 'primebrick-decimal'];
const serviceDir = process.cwd();
const workspaceRoot = resolve(serviceDir, '..', '..');

/** @type {import('node:child_process').ChildProcess | null} */
let child = null;
let restartTimer = null;
let deadLogged = false;

let pendingBoot = false;

// ── Noise filter ─────────────────────────────────────────────────────────
// bun prints one `warn: File <path> is not in the project directory` line
// per external file it cannot watch — hundreds per boot. Every file inside
// the watched LIBS repos IS compensated by this supervisor's own watchers,
// so those warnings are pure noise and are suppressed here. Anything else
// (including warnings for files OUTSIDE the watched set — e.g. a newly
// introduced external dependency nobody watches) passes through verbatim:
// the filter cannot silently hide real gaps.
const watchedRoots = LIBS.map((l) => resolve(workspaceRoot, l).replace(/\\/g, '/').toLowerCase());
const WATCH_WARN_RE = /File (.*?) is not in the project directory and will not be watched/;

function filterLine(line) {
  const m = line.match(WATCH_WARN_RE);
  if (m) {
    const p = m[1].replace(/\\/g, '/').toLowerCase();
    if (watchedRoots.some((r) => p.startsWith(r + '/'))) {
      return null; // compensated by dev-hot's own watchers — noise
    }
  }
  return line;
}

function makeFilterPipe(out) {
  let buf = '';
  return (chunk) => {
    buf += chunk.toString();
    let idx;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx + 1);
      buf = buf.slice(idx + 1);
      const filtered = filterLine(line);
      if (filtered !== null) out.write(filtered);
    }
  };
}

function boot() {
  deadLogged = false;
  child = spawn('bun', ['--conditions=development', '--hot', 'src/index.ts'], {
    cwd: serviceDir,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
  });
  child.stdout.on('data', makeFilterPipe(process.stdout));
  child.stderr.on('data', makeFilterPipe(process.stderr));
  child.on('exit', (code) => {
    child = null;
    // Re-bind only after the old process released the port — booting on a
    // timer raced the socket close and produced EADDRINUSE flaps.
    if (pendingBoot) {
      pendingBoot = false;
      boot();
      return;
    }
    // A crashed service stays down until the next watched edit — no
    // respawn loop while the developer is mid-fix.
    if (code !== null && code !== 0 && !deadLogged) {
      deadLogged = true;
      console.log(`[dev-hot] service exited (code ${code}) — edit a file to restart`);
    }
  });
}

function scheduleRestart() {
  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    pendingBoot = true;
    if (child && !child.killed) {
      child.kill();
    } else {
      pendingBoot = false;
      boot();
    }
  }, 200);
}

let watched = 0;
console.log(
  `[dev-hot] watching external lib sources: ${LIBS.join(', ')} — ` +
    `their bun "not in the project directory" warnings are compensated and suppressed`,
);
for (const lib of LIBS) {
  const dir = resolve(workspaceRoot, lib, 'src');
  try {
    if (!existsSync(dir)) continue;
    const w = watch(dir, { recursive: true }, (_event, filename) => {
      // Test-file edits shouldn't bounce the service.
      if (filename && filename.endsWith('.test.ts')) return;
      scheduleRestart();
    });
    w.on('error', (err) => console.warn(`[dev-hot] watcher error on ${dir}:`, err.message));
    watched++;
    console.log(`[dev-hot] watching ${dir}`);
  } catch (err) {
    console.warn(`[dev-hot] cannot watch ${dir}:`, /** @type {Error} */ (err).message);
  }
}

if (watched === 0) {
  console.warn('[dev-hot] no lib src dirs found from', workspaceRoot);
}

boot();
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    child?.kill();
    process.exit(0);
  });
}
