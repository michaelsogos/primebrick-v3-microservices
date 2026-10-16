# Devin Rule: DAL Usage — ONE way only

## Trigger
- Applies to ALL database access in this repository.

## The rule

Database access has a two-step convention:

- **`initDal()`** — bootstrap-only, called ONCE in `index.ts`; lives inside
  the service's own gateway module `<us>/src/db/dal.ts` (which wraps
  `getDal(config)` from `@primebrick/dal-pg`).
- **`getDal()`** — the accessor every other call site uses; fails fast
  with `"config is required on the first call"` if a method runs before
  bootstrap. Worker services should resolve it lazily (first use), never
  in constructors — constructors run at router-mount, before bootstrap.

Target shape (already live in the BE): worker services extend
`DomainService<TEntity>` from `@primebrick/dal-pg` — lazy `this.dal`/
`this.svc` seams, no per-domain `*_dal.ts`/`*-repo.ts` wrapper files
(existing ones like `docs-search-dal.ts`/`*-repository.ts` are legacy
debt — do NOT create new ones; new services extend `DomainService`).

Consumers (services, modules, controllers-via-services) MUST:
- import `getDal` from `@primebrick/dal-pg` (or the repo's `db/dal.ts`
  re-export) — or inherit `this.dal` from `DomainService`;
- use `Dal` methods — `findAll`, `find`, `findByPage`, `add`, `update`,
  `touch`, `delete`, `restore`, `hardDelete`, `*Many`, `vectorSearch`,
  `truncate(entity)`, `count`;
- multi-statement atomic work goes through `dal.transaction(txRepo => …)` —
  the callback receives a tx-scoped `Repository`, NEVER a raw client;
- connectivity/version probe is `dal.serverVersion()` (a successful call IS
  the health probe — there is no `ping()`);
- receive `Dal`/`Repository` (tx-scoped inside `transaction`) via parameters
  or the singleton — never construct their own connection.

Consumers MUST NOT — NO EXCEPTIONS, EVER:
- import `pg`, `pg.Pool`, `PoolClient` directly outside `src/db/`;
- call `getDal().getPool()` / `.query(` / `client.query` anywhere in
  application code — raw SQL is banned outright; there is no "legitimate
  infra SQL" (`SELECT 1`/`version()`/`TRUNCATE`/`BEGIN` are all covered by
  dedicated `Dal`/`Repository` methods);
- call `dal.withClient` — it is `private` to dal-pg internals;
- create `new Pool()`, `new Client()`, or raw `pool.query` calls;
- bypass dal-pg's `Repository` for entity reads/writes;
- write `upsert`/`INSERT … ON CONFLICT` — removed by design; the standard is
  read (`uuid`+`version`) then `add`/`update` (optimistic lock enforced).

## Library authoring (enforced by visibility)

- `src/db/pool.ts` `getPool()` exists for the infra layer only
  (`repository-factory.ts`, audit adapters). Application code importing it
  outside `src/db/` is a violation.
- TS visibility: infra internals stay `private`/module-local; consumers get
  only `getDal`. New helpers that would leak `pg` types must NOT be exported
  from public barrels.
- Lint/CI check: `pnpm check:standards` (wired into `prebuild` + `test`)
  fails the build on `pg` imports, `getPool()`, `.query(`, `new Pool(`,
  `withClient`, `upsert`, raw SQL literals, `new Repository(`,
  `client|pool.ping(` and `JSON.stringify`/`JSON.parse` in `src/**`.
  Legitimate sites (migration `getPool` seam, external wire formats like
  RFC7807/Brevo/OpenAI/inbound webhooks) carry an explicit
  `// standards-exempt: <rule> — <reason>` on the same/previous line —
  a missing reason is itself a violation.

## Audit vs events (do NOT conflate)

- **Audit trail** — the persistent `{table}_audit` row written by dal-pg's
  `AuditPort` on write/delete/restore. Same contract in BE and every US.
- **Entity-changed event** — the *event-sourcing/binding* signal emitted in
  parallel to the write so any service can intercept it (NATS
  `entity.<entity>.<action>` / Redis marker). The BE's audit adapter happens
  to publish that marker — it is a separate concern layered on the same hook.
- **Collaboration/SSE** — a CONSUMER of the entity-changed event, nothing to
  do with audit itself.

## Translations (per-module schema)

- `public.translations` = `app.*` keys (global). `system.translations` =
  `system.*` keys. Each microservice module owns `<schema>.translations`.
- BE manages CRUD over all module translation tables via its central
  translations gateway; modules read `app.*` globally and pull their own
  module table down to the BE on first module load.
- Key prefixes are authoritative: `app.*` must never live in
  `system.translations`, `system.*` must never live in `public.translations`
  (drift detected 2026-10-09 — see plan
  `ai-ownership-migration-and-nats-transport.md`).

## Deep dive

The normative rules live here; the full mechanics and rationale are in `DAL dev-guide repository-pattern` — link, do not duplicate.
