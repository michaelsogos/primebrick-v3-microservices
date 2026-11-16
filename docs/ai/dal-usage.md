# Devin Rule: DAL Usage — ONE way only

> Canonical body of `.devin/rules/dal-usage.md` — the rule file is a pointer to this page.

## Trigger
- Applies to ALL database access in this repository.

## The rule

Database access has a two-step convention:

- **`initDal()`** — bootstrap-only, called ONCE in `index.ts`; lives inside
  the service's own gateway module `<us>/src/db/dal.ts` (which wraps
  `getDal(config)` from `@primebrick/dal-pg`).
- **`getDal()`** — the singleton accessor; usable ONLY inside the declared
  seam list (`.devin/check-standards.json` → `dal-access.allowPaths`:
  `db/dal.ts`, `db/entity-repo.ts`, `adapters/config-repository-adapter.ts`,
  `index.ts`). Everywhere else data access comes from `DomainService`
  inheritance (`this.dal`/`this.svc`), never a `getDal()` call — the
  linter fails the build on it.

Canonical shape (live in BE and every US): worker services extend
`DomainService<TEntity>` from `@primebrick/dal-pg` — lazy `this.dal`/
`this.svc` seams, I/O-free constructors (the dal resolves at first use,
never at module import or router-mount time). There are no
`*_dal.ts`/`*-repo.ts`/`*-repository.ts` wrapper files and none may be
created — module files that own entity access are named `*-service.ts`
honestly; `layer-repo-import` flags `controllers/` importing any
repo/dal-named module.

Consumers (services, modules, controllers-via-services) MUST:
- extend `DomainService<TEntity>` for entity-bound work — `this.svc`
  (the `EntityService` write pipeline: hooks, actor stamping, audit-port
  resolution, optimistic lock, marker publish) is the ONLY write path;
- read through `this.dal` — `findAll`, `find`, `findByPage`,
  `findByUUID`, `count`, `vectorSearch`, `serverVersion` (a successful
  call IS the health probe — there is no `ping()`);
- run multi-statement atomic work through `this.dal.transaction(txRepo
  => …)` — the callback receives a tx-scoped `Repository`, NEVER a raw
  client; repo write calls inside it carry `{ actor }` explicitly (the
  runtime actor guard is fail-closed on `@AuditTrail` entities);
- forward explicit callers (NATS envelopes, webhook actors) via
  `runWithSession(actorSession(actor), …)` — `actorSession` lives in
  `db/entity-repo.ts`; outside a session `requireActor` throws by design.
- receive `Dal` (type-only — the constructor is not exported) /
  `Repository` via parameters or the inherited accessor — never
  construct their own connection.

Consumers MUST NOT — NO EXCEPTIONS, EVER:
- call any write verb on the dal/repository accessor: `add`, `update`,
  `delete`, `restore`, `hardDelete`, `truncate`, `addMany`,
  `updateMany`, `deleteMany`, `restoreMany`, `hardDeleteMany`,
  `upsert` — entity writes go through `this.svc` or the owning
  DomainService; `svc.bulkUpdate`/`bulkPurge` cover the bulk shapes
  (`dal-member-write` — unsuppressible);
- construct `new Dal(` — `Dal` is exported `type`-only by dal-pg; the
  singleton is owned by `initDal` (`dal-construct` — unsuppressible);
- call `getDal()`/`initDal()`/`resetDal()` or import them outside
  `dal-access.allowPaths` (`dal-access` — unsuppressible; the bare
  `dal.` alias and `dal["update"]` bracket access match the same rule);
- import `pg`, `pg.Pool`, `PoolClient` directly outside `src/db/`;
- call `getDal().getPool()` / `.query(` / `client.query` anywhere in
  application code — raw SQL is banned outright; there is no "legitimate
  infra SQL" (`SELECT 1`/`version()`/`TRUNCATE`/`BEGIN` are all covered
  by dedicated `Dal`/`Repository` methods);
- call `dal.withClient` — it is `private` to dal-pg internals;
- create `new Pool()`, `new Client()`, `new Repository(`, or raw
  `pool.query` calls;
- write `upsert`/`INSERT … ON CONFLICT` — removed by design; the
  standard is read (`uuid`+`version`) then `svc.create`/`svc.update`
  (optimistic lock enforced).

## Library authoring (enforced by visibility)

- `src/db/` exists for the infra layer only (`dal.ts` gateway,
  `entity-repo.ts` actor helpers). Application code importing infra
  internals outside the declared seams is a violation.
- TS visibility: infra internals stay `private`/module-local; `Dal`
  is a type-only export — `new Dal(` cannot even be imported. New
  helpers that would leak `pg` types must NOT be exported from public
  barrels.
- Lint/CI check: `pnpm check:standards` (wired into `prebuild` +
  `test`) fails the build on `pg` imports, `getPool()`, `.query(`,
  `new Pool(`, `withClient`, `upsert`, raw SQL literals,
  `new Repository(`, `new Dal(`, dal write verbs, `getDal`/imports
  outside allowPaths, `client|pool.ping(` and
  `JSON.stringify`/`JSON.parse` in `src/**`.
- Exemption model: the data-access rules (`dal-access`,
  `dal-construct`, `dal-member-write`, `pg-import`, `pg-pool`,
  `raw-query`, `raw-sql`, `getPool`) are **default-on in the consumer
  profile and cannot be silenced inline** — `standards-exempt` comments
  do not apply to them. The only seams that exist are the ones declared
  in `.devin/check-standards.json` `allowPaths` — reviewable repo
  config, not scattered comments. Non-governance rules still accept
  `// standards-exempt: <rule> — <reason>` (missing reason = violation).
- Baselines only SHRINK: `--write-baseline` was removed — new debt
  cannot be minted into `.devin/check-standards-baseline.json`.

## New services

- Clone `boilerplate/` (`cp -r boilerplate <svc>`) — the smallest
  governed service shape: it carries this whole contract already wired
  (allowPaths, adapters, `db/dal.ts`, `entity-repo.ts`, DomainService
  example, signed db-meta). See `docs/dev-guide/adding-a-service.mdx`.

## Audit vs events (do NOT conflate)

- **Audit trail** — the persistent `{table}_audit` row written by
  dal-pg's `AuditPort` on write/delete/restore; bound automatically and
  ONLY for `@AuditTrail` entities (auditable columns without a trail
  table get no audit writes). Same contract in BE and every US.
- **Entity-changed event** — the *event-sourcing/binding* signal emitted
  in parallel to the write so any service can intercept it (NATS
  `entity.<entity>.<action>` / Redis marker). The marker audit port
  publishes it — a separate concern layered on the same hook.
- **Collaboration/SSE** — a CONSUMER of the entity-changed event,
  nothing to do with audit itself.

## Translations (per-module schema)

- `public.translations` = `app.*` keys (global). `system.translations` =
  `system.*` keys. Each microservice module owns `<schema>.translations`.
- BE manages CRUD over all module translation tables via its central
  translations gateway; modules read `app.*` globally and pull their own
  module table down to the BE on first module load.
- Key prefixes are authoritative: `app.*` must never live in
  `system.translations`, `system.*` must never live in
  `public.translations` (drift detected 2026-10-09 — see plan
  `ai-ownership-migration-and-nats-transport.md`).

## Deep dive

The normative rules live here; the full mechanics and rationale are in `DAL dev-guide repository-pattern` — link, do not duplicate.
