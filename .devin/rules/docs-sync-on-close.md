# Devin Rule: Sync Docs on GitFlow Close

## Trigger
- Applies when closing a GitFlow branch (feature, release, or hotfix).
- Fires BEFORE the merge step of the closing procedure in docs/gitflow.md.

## Diff base per branch type

The diff base depends on which branch type is being closed. This ensures
we only see what changed ON the branch, not accumulated changes from
other branches:

| Branch type | Diff command | What it shows |
|-------------|-------------|---------------|
| feature/* | `git diff develop...feature/<name>` | Changes made on the feature branch |
| release/* | `git diff develop...release/<version>` | Changes made during release stabilization (usually just version bump) |
| hotfix/* | `git diff main...hotfix/<version>` | The hotfix changes only |

**Critical for release branches**: releases are often just version bumps
with no code changes. The features were already merged to develop (with
their docs) during feature closes. The release diff against develop
should be near-empty. If it is — skip docs entirely.

## Procedure

When the user requests closing a feature/release/hotfix branch, BEFORE
performing the merge:

### 1. Scan for undocumented services (MANDATORY)

Before looking at the diff, scan the repo for microservices that have NO doc
page yet. This ensures existing code gets documented even if it was written
before the branch was created.

**How to detect microservices:**
List all top-level sub-folders. A sub-folder is a microservice iff it contains
BOTH:
- a `package.json` with a `name` starting with `primebrick-`
- a `src/index.ts` entry point

**How to detect undocumented services:**
For each microservice sub-folder, check whether
`docs/user-guide/services/<service>.mdx` exists (where `<service>` is the
sub-folder name). If it does NOT exist, the service is **undocumented** and
must get an initial doc page generated (see Step 5a).

Also check whether the shared pages exist:
- `docs/user-guide/overview.mdx`
- `docs/user-guide/architecture.mdx`
- `docs/user-guide/conventions.mdx`

If any shared page is missing, it will be created in Step 5a.

### 2. Check the diff (correct base per branch type)
Run the appropriate diff command from the table above with `--stat` first:
```
git diff <base>...<branch> --stat
```
Then review the actual diff:
```
git diff <base>...<branch>
```

### 3. Determine if docs need updating (service-aware)

**For release branches**: if the diff is only `package.json` (version bump)
and/or lock files, SKIP diff-based docs entirely. Docs were already updated
during feature closes. BUT if there are undocumented services from Step 1,
still generate their initial docs (Step 5a) before proceeding to step 6.

**For feature/hotfix branches**: this repo is a multi-service monorepo.
First group changed paths by their top-level sub-folder:

- A sub-folder is a microservice iff it contains BOTH a `package.json` with
  a `name` starting with `primebrick-` AND a `src/index.ts` entry point.
- `changed services` = unique top-level dirs of changed files that are
  microservices.
- `shared changes` = changed files NOT under a microservice sub-folder
  (`docs/`, `.devin/`, `scripts/`, `docker-templates/`, `AGENTS.md`, root
  files).

Then, for EACH changed service, check whether any changed file is
user-facing (paths relative to `<service>/`):

| Path pattern | Doc topic |
|--------------|-----------|
| `src/server/*-route.ts`, `src/server/openapi-route.ts` | HTTP routes & OpenAPI |
| `src/nats/handlers.ts`, `src/nats/types.ts` | NATS subjects & request/reply |
| `src/domain/entities/*.ts`, `src/domain/entities/registry.ts` | Entities & data model |
| `src/providers/*.ts` | Provider integrations |
| `src/services/*.ts` | Service actions |
| `src/adapters/*.ts` | SDK usage / adapter ports |
| `Dockerfile`, `docker-compose.dev.yml`, `.env.example` | Deployment & config |
| `db-meta/patches/*` | DB schema (only if API-affecting) |
| `src/index.ts` | Lifecycle / health / service registration |

Shared/repo-level user-facing files (NOT under a service):

| Path pattern | Doc topic |
|--------------|-----------|
| `docker-templates/*` | Cross-service deployment |
| `scripts/*` (if it changes service scaffolding) | New service template |
| `.devin/rules/api-path-conventions.md` | API conventions (shared page) |

If NO service and NO shared change has user-facing files, but there ARE
undocumented services from Step 1 → continue to Step 5a (generate initial
docs). If there are NO undocumented services either → skip to step 6
(proceed with normal close).

### 4. Anti-rewrite check (MANDATORY, per page)

For each doc page that might be affected (one per changed service topic,
plus any shared page touched by shared changes):

- If the existing docs ALREADY describe the changed behavior accurately
  → do NOT update that page. Skip it.
- If the existing docs are MISSING the changed behavior
  → add the missing content with minimal edits.
- If the existing docs are INACCURATE (describe old behavior)
  → fix only the inaccurate parts. Do not rewrite the page.
- If no doc page exists for the changed topic
  → create a new page and add it to `_order.json`.

**Page mapping** (see `.devin/skills/make-docs/SKILL.md` for the full table):

| Changed topic | Page |
|---------------|------|
| Any per-service user-facing file | `docs/user-guide/services/<service>.mdx` |
| `docker-templates/*` | `docs/user-guide/architecture.mdx` (deployment section) |
| `.devin/rules/api-path-conventions.md` | `docs/user-guide/conventions.mdx` |
| `scripts/*` scaffolding | `docs/user-guide/overview.mdx` (or `architecture.mdx`) |

**The goal is surgical edits, not regeneration.** A 10-line code change
should produce at most a few lines of doc changes, not a rewritten page.

### 5. Update docs/user-guide/ and commit

#### 5a. Generate initial docs for undocumented services

For each undocumented service (from Step 1), READ the service's existing
code and CREATE `docs/user-guide/services/<service>.mdx` with:

1. **Frontmatter**: `title`, `description`
2. **Overview**: what the service does (from `src/index.ts` and `package.json`)
3. **HTTP routes**: from `src/server/*-route.ts` and `openapi-route.ts`
4. **NATS subjects**: from `src/nats/handlers.ts` and `types.ts`
5. **Entities**: from `src/domain/entities/*.ts` and `registry.ts`
6. **Providers**: from `src/providers/*.ts`
7. **Service actions**: from `src/services/*.ts`
8. **Deployment**: from `Dockerfile`, `docker-compose.dev.yml`, `.env.example`
9. **Health & lifecycle**: from `src/index.ts`

Content comes ONLY from reading the actual source code — do NOT invent APIs.
Use `<Mermaid chart={...} />` for diagrams. English only, developer audience.
This is the ONE case where a full page is written from scratch (anti-rewrite
does not apply — there is nothing to rewrite).

Also create any missing shared pages (`overview.mdx`, `architecture.mdx`,
`conventions.mdx`) following the same conventions as
`.devin/skills/make-docs/SKILL.md` Step 6b.

#### 5b. Surgical updates for changed services

For each page that needs updating (after the anti-rewrite check in Step 4):
- Follow `.devin/rules/docs-user-guide.md` for editorial conventions
- Use `<Mermaid chart={...} />` for diagrams, never ```Code or ```mermaid
- Make minimal edits — preserve existing prose structure

#### 5c. Commit

Commit ALL doc updates (initial docs + surgical updates) ON the branch
BEFORE merging:
```
git add docs/user-guide/
git commit -m "docs: update user-guide for <branch-name> changes"
```

### 6. Proceed with normal close
Continue with the standard GitFlow closing procedure from docs/gitflow.md
(merge --no-ff, push, delete branch, etc.).

## What NOT to do
- ❌ Do NOT diff against `main` for release branches — use `develop` as base
- ❌ Do NOT skip the undocumented-service scan (Step 1) — existing code with
  no doc page MUST get documented, even if the diff is empty
- ❌ Do NOT rewrite pages that already describe the changed behavior
- ❌ Do NOT regenerate docs at release close if features already updated them
- ❌ Do NOT skip the anti-rewrite check — always read existing docs first
- ❌ Do NOT update docs after the merge — update before, on the branch
- ❌ Do NOT create docs for internal-only changes (refactors, tests, configs)
- ❌ Do NOT make large edits for small code changes — be surgical
- ❌ Do NOT invent APIs, routes, or entities when generating initial docs —
  read the actual source code

## Enforcement
- AI agent MUST scan for undocumented services before checking the diff
- AI agent MUST generate initial docs for any service with no doc page
- AI agent MUST use the correct diff base per branch type
- AI agent MUST skip diff-based docs for version-bump-only releases (but
  still generate initial docs for undocumented services)
- AI agent MUST read existing docs before updating (anti-rewrite check)
- AI agent MUST commit doc updates on the branch before merging
- If unsure whether a change is user-facing, lean toward updating docs
- If unsure whether existing docs are accurate, ask the user
