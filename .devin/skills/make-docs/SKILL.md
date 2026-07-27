---
name: make-docs
description: Check current branch diff and surgically update docs/user-guide for microservices
allowed-tools: [read, write, edit, exec, grep, find_file_by_name]
---

# make-docs

Manually refresh developer documentation for this repo. Run this when you want
to update docs without closing a GitFlow branch, or to verify docs are current.

This repo is a **multi-service monorepo**: each microservice lives in a
self-contained sub-folder (`emailsender/`, future services to follow) with its
own `src/`, `package.json`, `Dockerfile`, `db-meta/`. The skill is
**service-aware**: it groups changed files by their service sub-folder and maps
each service's changes to the right doc page.

The skill does TWO things:
1. **Undocumented-service scan** — detects microservices that exist in the repo
   but have no `docs/user-guide/services/<service>.mdx` page yet, and generates
   initial documentation from their existing code. This runs regardless of the
   diff — existing code that was never documented MUST get a page.
2. **Diff-based update** — for services that changed since the diff base,
   surgically updates their doc page (anti-rewrite check).

**API reference is NOT handled by this skill.** The OpenAPI specs for each
microservice are extracted by the docs repo's `fetch-openapi.mjs` script at
build time, which scans the shallow-cloned repos for `openapi-route.ts` files
and writes them to `apis/<service>.json` for Zudoku's interactive API Catalog.
This skill only handles the **prose guide pages**.

## Steps

### 1. Detect branch and diff base

Run `git branch --show-current` to get the current branch name. Determine the
diff base:

- `feature/*` → base is `develop`
- `release/*` → base is `develop`
- `hotfix/*` → base is `main`
- `develop` or `main` → diff against the last release tag (`git describe --tags --abbrev=0`)
- Other → ask the user which base to diff against

### 2. Scan for undocumented services (MANDATORY)

Before looking at the diff, scan the repo for microservices that have NO doc
page yet. This ensures existing code gets documented even if it was written
before the diff base.

**How to detect microservices:**
List all top-level sub-folders. A sub-folder is a microservice iff it contains
BOTH:
- a `package.json` with a `name` starting with `primebrick-`
- a `src/index.ts` entry point

**How to detect undocumented services:**
For each microservice sub-folder, check whether
`docs/user-guide/services/<service>.mdx` exists (where `<service>` is the
sub-folder name, e.g. `emailsender`). If it does NOT exist, the service is
**undocumented** and must get an initial doc page generated in Step 6.

Also check whether the shared pages exist:
- `docs/user-guide/overview.mdx`
- `docs/user-guide/architecture.mdx`
- `docs/user-guide/conventions.mdx`

If any shared page is missing, it will be created in Step 6.

**Record the results:**
```
undocumented services = [list of service sub-folder names with no .mdx page]
missing shared pages  = [list of missing shared pages]
```

### 3. Check the diff

```
git diff <base>...HEAD --stat
git diff <base>...HEAD
```

If the diff is empty or only `package.json`/lock files:
- If there are undocumented services OR missing shared pages → continue to
  Step 6 (generate initial docs for them).
- If everything is already documented → report "No user-facing changes
  detected. Docs are current." and stop.

### 4. Group changed paths by service (MANDATORY)

This repo hosts multiple microservices. Group every changed file path by its
top-level sub-folder and classify it as either a **service change** or a
**shared/repo-level change**.

A top-level sub-folder is a microservice iff it contains BOTH:
- a `package.json` with a `name` starting with `primebrick-`
- a `src/index.ts` entry point

```
changed services = unique top-level dirs of changed files that are microservices
shared changes   = changed files NOT under a microservice sub-folder
                   (e.g. docs/, .devin/, scripts/, docker-templates/,
                    AGENTS.md, root files)
```

### 5. Determine if user-facing files changed (per service)

For EACH changed service, user-facing files are (paths relative to
`<service>/`):

| Path pattern | Doc topic |
|--------------|-----------|
| `src/server/*-route.ts`, `src/server/openapi-route.ts` | HTTP routes & OpenAPI |
| `src/nats/handlers.ts`, `src/nats/types.ts` | NATS™ subjects & request/reply |
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

If a service has changes but NONE of them match the per-service table above,
that service is considered to have NO user-facing changes — skip it for
diff-based updates (but it may still need initial docs from Step 2).

### 6. Generate / update doc pages

This step handles the prose guide pages only (NOT the API reference — that is
handled by the docs repo's `fetch-openapi.mjs` at build time).

#### 6a. Generate initial docs for undocumented services

For each undocumented service (from Step 2), READ the service's existing code
and CREATE `docs/user-guide/services/<service>.mdx` with:

1. **Frontmatter**: `title`, `description`
2. **Overview**: what the service does (1-2 paragraphs, from `src/index.ts`
   and `package.json` description)
3. **HTTP routes**: read `src/server/*-route.ts` — high-level summary of
   route groups (entity CRUD, actions, webhooks, system). Do NOT list every
   operation — the full API reference is in Zudoku's interactive API Catalog,
   generated from the OpenAPI spec by `fetch-openapi.mjs`. Link to it:
   `See the [API Catalog](/catalog/<service>) for the full operation list.`
4. **NATS™ subjects**: read `src/nats/handlers.ts` and `src/nats/types.ts` —
   list every subject the service subscribes to or publishes, with
   request/response schemas.
5. **Entities**: read `src/domain/entities/*.ts` and `registry.ts` — list
   every entity with its fields and types.
6. **Providers**: read `src/providers/*.ts` — list each provider integration.
7. **Service actions**: read `src/services/*.ts` — list each action.
8. **Deployment**: read `Dockerfile`, `docker-compose.dev.yml`, `.env.example`
   — list required env vars and deployment notes.
9. **Health & lifecycle**: read `src/index.ts` — describe health check,
   graceful shutdown, service registration behavior.

**Rules for initial generation:**
- Content comes ONLY from reading the actual source code — do NOT invent APIs,
  routes, or entities that don't exist in the code.
- Use `<Mermaid chart={...} />` for any diagrams (e.g. request flow).
- English only, developer audience, direct technical tone.
- This is the ONE case where a full page is written from scratch (the
  anti-rewrite check does not apply — there is nothing to rewrite).
- Add the service slug to `_order.json` (Step 7).

#### 6b. Create missing shared pages

For each missing shared page (from Step 2), create it:

- **`overview.mdx`**: repo overview — what the microservices repo is, list of
  microservices (with links to their service pages), high-level architecture.
- **`architecture.mdx`**: NATS™ message bus, BE `/ws/:serviceCode/*` proxy,
  SDK lifecycle (service registration, heartbeat, graceful shutdown), database
  per-service isolation.
- **`conventions.mdx`**: API path conventions (from
  `.devin/rules/api-path-conventions.md`), data model rules (snake_case, no
  DTO transformation), package versioning rules.

#### 6c. Surgical updates for changed services (diff-based)

For each changed service with user-facing changes (from Step 5), apply the
anti-rewrite check:

1. Read the existing `docs/user-guide/services/<service>.mdx`
2. Compare against the diff
3. Decide:
   - Already accurate → SKIP (no edit)
   - Missing info → ADD minimal content
   - Inaccurate → FIX only the wrong parts
   - No page exists → CREATE new page (treat as undocumented, follow 6a)

A 10-line code change → at most a few lines of doc changes, not a rewritten page.

#### 6d. Surgical updates for shared changes

For shared user-facing changes (from Step 5), update the relevant shared page:
- `docker-templates/*` → `architecture.mdx` (deployment section)
- `.devin/rules/api-path-conventions.md` → `conventions.mdx`
- `scripts/*` scaffolding → `overview.mdx` (or `architecture.mdx`)

Apply the same anti-rewrite check.

### 7. Update _order.json

Ensure every service page and shared page is listed in
`docs/user-guide/_order.json` (see `.devin/rules/docs-order.md`).
Service pages go under the `services/` group, after the shared pages:

```json
{
  "pages": [
    "overview",
    "architecture",
    "conventions",
    "services/emailsender"
  ]
}
```

Add newly created pages. Do NOT remove pages that still exist.

### 8. Report

Summarize in chat:
- **Undocumented services found**: which services had no doc page and got
  initial documentation generated
- **Missing shared pages created**: which shared pages were created
- **Diff-based updates**: which services had user-facing changes in the diff
  and which topics changed
- **Which guide pages were updated and why** (generated/added/fixed/created)
- **Which guide pages were skipped** (already accurate)
- **Whether `_order.json` was updated**
- That changes are NOT committed — wait for user instruction to commit
