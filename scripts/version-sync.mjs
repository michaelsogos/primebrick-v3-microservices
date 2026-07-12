import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8").trim();
}

function getBranchName() {
  try {
    return sh("git rev-parse --abbrev-ref HEAD");
  } catch {
    return null;
  }
}

// Parse a semver-like version from a branch name: release/0.2.0, hotfix/0.2.1
function parseBranchVersion(branch) {
  const m = /^(?:release|hotfix)\/(\d+)\.(\d+)\.(\d+)$/.exec(branch);
  if (!m) return null;
  return `${m[1]}.${m[2]}.${m[3]}`;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

/**
 * Find all microservice package.json files in the repo.
 * Each subdirectory with a package.json that has "private": true and
 * a "name" starting with "primebrick-" is considered a microservice.
 */
function findMicroservicePackages() {
  const root = process.cwd();
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const packages = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "scripts" || entry.name === "docs") continue;
    const pkgPath = path.join(root, entry.name, "package.json");
    if (fs.existsSync(pkgPath)) {
      packages.push({ dir: entry.name, path: pkgPath });
    }
  }
  return packages;
}

const branch = getBranchName();

// Detached HEAD (e.g. CI tag checkout) — version is already committed in package.json
if (!branch || branch === "HEAD") {
  process.exit(0);
}

// develop, main, feature/* — no version bump needed
if (
  branch === "develop" ||
  branch === "main" ||
  branch.startsWith("feature/")
) {
  process.exit(0);
}

// release/X.Y.Z or hotfix/X.Y.Z — sync ALL microservice package.json to the branch version
const expectedVersion = parseBranchVersion(branch);

if (!expectedVersion) {
  // Unknown branch pattern — do nothing
  process.exit(0);
}

const packages = findMicroservicePackages();

if (packages.length === 0) {
  console.log("version-sync: no microservice packages found");
  process.exit(0);
}

let changed = false;
for (const { dir, path: pkgPath } of packages) {
  const pkg = readJson(pkgPath);
  if (pkg.version !== expectedVersion) {
    pkg.version = expectedVersion;
    writeJson(pkgPath, pkg);
    console.log(`version-sync: updated ${dir}/package.json version to ${expectedVersion} (branch: ${branch})`);
    changed = true;
  } else {
    console.log(`version-sync: ${dir}/package.json version already ${expectedVersion}`);
  }
}

if (!changed) {
  console.log(`version-sync: all microservice packages already at ${expectedVersion}`);
}
