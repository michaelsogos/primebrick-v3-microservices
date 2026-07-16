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

## Steps

### 1. Detect branch and diff base

Run `git branch --show-current` to get the current branch name. Determine the
diff base:

- `feature/*` → base is `develop`
- `release/*` → base is `develop`
- `hotfix/*` → base is `main`
- `develop` or `main` → diff against the last release tag (`git describe --tags --abbrev=0`)
- Other → ask the user which base to diff against

### 2. Check the diff

```
git diff <base>...HEAD --stat
git diff <base>...HEAD
```

If the diff is empty or only `package.json`/lock files → report "No user-facing
changes detected. Docs are current." and stop.

### 3. Group changed paths by service (MANDATORY)

This repo hosts multiple microservices. Before deciding whether docs need
updating, group every changed file path by its top-level sub-folder and
classify it as either a **service change** or a **shared/repo-level change**.

A top-level sub-folder is a microservice iff it contains BOTH:
- a `package.json` with a `name` starting with `primebrick-`
- a `src/index.ts` entry point

```
changed services = unique top-level dirs of changed files that are microservices
shared changes   = changed files NOT under a microservice sub-folder
                   (e.g. docs/, .devin/, scripts/, docker-templates/,
                    AGENTS.md, root files)
```

If there are NO changed services AND NO shared user-facing changes → report
"No user-facing changes. Docs are current." and stop.

### 4. Determine if user-facing files changed (per service)

For EACH changed service, user-facing files are (paths relative to
`<service>/`):

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

If a service has changes but NONE of them match the per-service table above,
that service is considered to have NO user-facing changes — skip it.

If NO service and NO shared change has user-facing files → report "No
user-facing changes. Docs are current." and stop.

### 5. Anti-rewrite check (MANDATORY, per page)

For each doc page that might be affected (one per changed service topic, plus
any shared page touched by shared changes):

1. Read the existing page content under `docs/user-guide/`
2. Compare against the diff (and the service's changed files)
3. Decide:
   - Already accurate → SKIP (no edit)
   - Missing info → ADD minimal content
   - Inaccurate → FIX only the wrong parts
   - No page exists → CREATE new page, add to `_order.json`

A 10-line code change → at most a few lines of doc changes, not a rewritten page.

### 6. Update docs/user-guide/

**Doc page structure** (see `.devin/rules/docs-user-guide.md` for the full
convention):

```
docs/user-guide/
  _order.json
  overview.mdx              # repo overview, microservices list, architecture
  architecture.mdx          # NATS bus, BE proxy, SDK lifecycle (shared)
  conventions.mdx           # API path conventions, data model rules (shared)
  services/
    <service>.mdx           # one page per microservice (e.g. emailsender.mdx)
```

Mapping from changed topic → page:

| Changed topic | Page |
|---------------|------|
| Any per-service user-facing file | `services/<service>.mdx` |
| `docker-templates/*` | `architecture.mdx` (deployment section) |
| `.devin/rules/api-path-conventions.md` | `conventions.mdx` |
| `scripts/*` scaffolding | `overview.mdx` (or `architecture.mdx`) |

Editorial conventions (`.devin/rules/docs-user-guide.md`):
- Use `<Mermaid chart={...} />` for diagrams, never ```Code or ```mermaid
- Minimal edits — preserve existing prose structure
- English only, developer audience, direct technical tone

### 7. Update _order.json

When creating a new page, add its slug to `docs/user-guide/_order.json` in the
logical reading position (see `.devin/rules/docs-order.md`). Service pages go
under the `services/` group, after the shared pages:

```json
{
  "pages": ["overview", "architecture", "conventions", "services/emailsender"]
}
```

### 8. Report

Summarize in chat:
- Which services had user-facing changes (and which topics per service)
- Which shared/repo-level changes were user-facing
- Which doc pages were updated and why (added/fixed/created)
- Which doc pages were skipped (already accurate)
- Whether `_order.json` was updated
- That changes are NOT committed — wait for user instruction to commit
