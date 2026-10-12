// docs-generate.ts — full docs pipeline: extract FE page facts → render MDX →
// write into the docs repo manual dir (committed as code — see ai-plans
// guide-docs-runtime-pipeline.md open question #2).
//
// Usage: bun scripts/docs-generate.ts [--no-index]
// Env:   DATABASE_URL (required), FE_DIR, BE_DIR, DOCS_DIR
//        DOCS_DIR default: ../../../primebrick-be-v3/docs/user-guide/generated
//        — generated manuals live in the OWNING repo (BE ships them in its
//        docs pack); generated/ is pipeline-owned, manual/ is hand-written.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from "@primebrick/sdk";

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const WORKSPACE = resolve(SCRIPTS, '..', '..', '..');
const DOCS_DIR =
  process.env.DOCS_DIR ??
  join(WORKSPACE, 'primebrick-be-v3', 'docs', 'user-guide', 'generated');
const PAGES_JSON = join(tmpdir(), 'primebrick-pages-all.json');

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const run = (script: string, args: string[], outFile?: string) => {
  const r = spawnSync('bun', [join(SCRIPTS, script), ...args], {
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    process.stderr.write(r.stderr);
    throw new Error(`${script} failed (${r.status})`);
  }
  if (outFile) writeFileSync(outFile, r.stdout);
  else process.stdout.write(r.stdout);
};

logger.info('extract →', { tags: ["docs-generate"], details: [PAGES_JSON] });
run('docs-extract.ts', [], PAGES_JSON);
logger.info('render →', { tags: ["docs-generate"], details: [DOCS_DIR] });
run('docs-render.ts', [PAGES_JSON, DOCS_DIR]);

if (!process.argv.includes('--no-index')) {
  const full = process.argv.includes('--full');
  logger.info(`index → docs_kb (${full ? 'FULL reinit' : 'incremental'})`, { tags: ["docs-generate"] });
  run('index-docs.ts', full ? ['--full'] : []);
}
logger.info('done', { tags: ["docs-generate"] });