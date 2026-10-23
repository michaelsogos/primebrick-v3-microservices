#!/usr/bin/env node
/**
 * deploy-service.mjs — produce a self-contained deployable dir for one
 * microservice via `pnpm deploy`.
 *
 * Usage:
 *   node scripts/deploy-service.mjs <service-dir-name>   # e.g. webhook
 *
 * What it does:
 *   1. Builds the service (`pnpm --filter <pkg> run build` — full prebuild
 *      chain included, so a deployed artifact is always a verified one).
 *   2. Runs `pnpm deploy --prod` with workspace-package injection enabled
 *      at invocation time only (`--config.inject-workspace-packages=true`),
 *      so dev installs keep linked workspace deps while the deployed copy
 *      vendors them as real packages under `node_modules/.pnpm`.
 *   3. Emits to <primebrick>/temp/deploy-out/<service>/ — a build artifact,
 *      regenerated on demand; temp is purgeable by design.
 *
 * The deployed dir is the Docker build context:
 *   docker build -f primebrick-us-v3/<svc>/Dockerfile <primebrick>/temp/deploy-out/<svc>
 *
 * Requires the pnpm workspace to exist (deploy discovers it by walking up
 * for pnpm-workspace.yaml). When the workspace is retired and dependencies
 * become real versions, CI switches to a plain `pnpm install --prod` flow.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const service = process.argv[2];
if (!service) {
  console.error("usage: node scripts/deploy-service.mjs <service-dir-name>");
  process.exit(1);
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serviceDir = join(repoRoot, service);
const pkgPath = join(serviceDir, "package.json");
if (!existsSync(pkgPath)) {
  console.error(`no package.json at ${pkgPath} — '${service}' is not a service dir`);
  process.exit(1);
}
const pkgName = JSON.parse(readFileSync(pkgPath, "utf-8")).name;

// Discover the pnpm workspace root — a sibling dir of this repo holding
// pnpm-workspace.yaml whose `packages:` globs reference this repo.
const reposParent = dirname(repoRoot);
const wsCandidates = readdirSync(reposParent, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => join(reposParent, d.name, "pnpm-workspace.yaml"))
  .filter((p) => existsSync(p) && readFileSync(p, "utf-8").includes(repoRoot.split(/[\\/]/).pop()));
if (wsCandidates.length !== 1) {
  console.error(
    wsCandidates.length === 0
      ? "no sibling pnpm-workspace.yaml covering this repo — deploy requires the pnpm workspace"
      : `ambiguous workspace roots: ${wsCandidates.join(", ")}`,
  );
  process.exit(1);
}
const wsRoot = dirname(wsCandidates[0]);

const outDir = join(dirname(wsRoot), "temp", "deploy-out", service);
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(dirname(outDir), { recursive: true });

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const run = (args, cwd = wsRoot) => {
  console.log(`$ pnpm ${args.join(" ")}`);
  const r = spawnSync(pnpm, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run(["--filter", pkgName, "run", "build"]);
run([
  "--config.inject-workspace-packages=true",
  "--filter", pkgName,
  "deploy", "--prod", outDir,
]);

// pnpm deploy vendors node_modules but leaves `workspace:*` specifiers
// literal in the emitted package.json. Rewrite them to the pinned version
// of the injected package so the deployed manifest is truthful and
// installable on its own (npm publish path / lockfile-free install).
const deployedPkgPath = join(outDir, "package.json");
const deployedPkg = JSON.parse(readFileSync(deployedPkgPath, "utf-8"));
for (const [dep, spec] of Object.entries(deployedPkg.dependencies ?? {})) {
  if (!spec.startsWith("workspace:")) continue;
  const depPkgPath = join(outDir, "node_modules", dep, "package.json");
  const { version } = JSON.parse(readFileSync(depPkgPath, "utf-8"));
  deployedPkg.dependencies[dep] = version;
  console.log(`pinned ${dep} → ${version}`);
}
writeFileSync(deployedPkgPath, JSON.stringify(deployedPkg, null, 2) + "\n");

console.log(`\ndeployed → ${outDir}`);
console.log(`docker build -f primebrick-us-v3/${service}/Dockerfile ${outDir}`);
