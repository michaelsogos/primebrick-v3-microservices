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

const LIBS = ['primebrick-v3-sdk', 'primebrick-dal-v3', 'primebrick-v3-core'];
const serviceDir = process.cwd();
const workspaceRoot = resolve(serviceDir, '..', '..');

/** @type {import('node:child_process').ChildProcess | null} */
let child = null;
let restartTimer = null;
let deadLogged = false;

let pendingBoot = false;

function boot() {
  deadLogged = false;
  child = spawn('bun', ['--conditions=development', '--hot', 'src/index.ts'], {
    cwd: serviceDir,
    stdio: 'inherit',
    env: process.env,
  });
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
