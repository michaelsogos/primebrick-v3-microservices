# i18n Namespace Segregation (microservice contract)

> `.devin/rules/` may point here — canonical text for how a US service
> owns and cites translation keys. The platform-wide contract lives in
> `primebrick-be-v3/docs/ai/i18n-namespace-segregation.md`; this page is
> the module-author view.

## The rule

**A module never knows another module — not by convention, not by
accident.** Runtime availability (a loaded dict, a seeded row, a key the
shell happens to resolve) is NOT permission to cite it.

## What your service may cite

| Namespace | Allowed? | Examples |
|---|---|---|
| `{your-schema}.*` | ✅ always | `job.entities.job_run.singular`, `ai.settings.config.models.refresh` |
| `app.*` | ✅ always | `app.loading`, `app.common.delete_failed`, `app.entities.list.no_records` |
| `system.*` | ❌ never | platform/shell-owned vocabulary — cite `app.*` or own keys instead |
| `custom.*` | ❌ never | customer-owned runtime keys |
| another module's ns | ❌ never | `crm.*` from `ai` code, … |

This applies identically in `src/` (BE side), `fe/src/` (remote
bundles), `db-meta/patches/*.sql` (seeds + key references), and any
metadata field that carries an i18n key (`label_key`, `labelKey`,
`messageKey`, `errorScopeKey`, `title_key`, `tooltip`, …).

## How it is enforced

`pnpm check:standards` (and CI on every push/PR) fails the service when
code cites a forbidden namespace:

- `.devin/check-standards.json` → `i18n_namespaces: ["app", "{code}"]` —
  declaring `system` or `custom` here is itself a violation.
- `i18n-key-ns` scans `t(`/`$t(`/`tFn(` calls and `*_key`/`*Key`/
  `tooltip`/`tooltip_title` fields — literals AND template static
  prefixes.
- `i18n-sql-ns` + `i18n-sql-key-ref` scan `db-meta/patches/*.sql` —
  seeds may only write `{app, own}` keys; `*_key` references (config
  rows, entity meta JSON) may only cite `{app, own}`.
- `i18n_key_ref_exempt` / `i18n_sql_exempt` in the config are
  filename-level grandfathering for **shipped** patches — never add new
  names.

`// standards-exempt:` comments do NOT cover i18n rules — cite a legal
key instead.

## Adding a key

Seed patch in YOUR service's `db-meta/patches/`, targeting
`{your_schema}.translations`, keys under `{your_schema}.*`, all seven
supported languages. Never write to `public`/`system`/`custom` schemas —
shared `app.*` vocabulary is platform-seeded in be-v3 (propose there when
a genuinely shared key is missing).

## Reading another namespace (rare, gated)

If a module surface must resolve a key it does not own, the only legal
path is the platform RPC — never a shared dict assumption:

- HTTP: `GET /api/v1/system/translations/find?matches[]={m}`
- NATS: `callNats("system.translations.find", …)`
- FE remote bundles: host-provided `ctx.i18n` / the shell's
  `loadTranslationsByKeys` enrichment — never fetch foreign dicts
  directly.

Matchers are key-scoped (`{ns}`, `{ns}.*`, `{ns}.path`, `{ns}.path.*`),
≤64 per call. There is no bulk foreign-dict API by design.

## Common traps

- `system_key`/`systemKey` fields carry NATS subjects, not translations —
  the scanner skips them deliberately; do not repurpose them for i18n.
- `scope:`/`message:` fields want resolved TEXT (call `t(key)`), not a
  raw key string — `scope: 'job.runDetail'` renders literally.
- Registration payloads (`createMicroservice({ labelKey })`) are scanned
  like any other field — the registration file is where the module
  declares itself to the platform.

## Never a phase 2 — translations are complete at birth or they are bugs

Every translation key is seeded for **all seven supported languages** (de-DE, en-GB, en-US, es-ES, fr-FR, it-IT, pt-PT) in the very same patch that introduces it — **never deferred** to a later phase, never partial, never "english for now, translate later". A missing row in any language is a bug, not a partial feature: the end user otherwise sees raw keys or foreign text in the UI. Gender and idiom are correct by construction because the seed carries the exact string per language — nothing is composed at runtime. If a translation is hard, write it anyway: an imperfect human-grade translation beats a raw key, and the fix is one UPDATE away.

## Related documents

The translations doctrine is one family — no single document is sufficient alone:

- `docs/ai/i18n.md` + `docs/dev-guide/i18n.mdx` (fe-v3) — FE consumption rules, UiLang ↔ dictionary parity, raw-key rendering
- `docs/ai/i18n-translation-sources.md` (fe-v3) — BE owns all translations; FE fallback is English-only `app.*` keys
- `docs/ai/translation-key-convention.md` (fe-v3, be-v3) — snake_case singular key naming
- `docs/ai/i18n-namespace-segregation.md` (be-v3, us-v3) — services seed their own schema, never public/system/custom
- `docs/ai/translations-cache-invalidation.md` (be-v3) — out-of-band writes require Redis invalidation
- `docs/dev-guide/translations.mdx` (be-v3, v3-sdk) — end-to-end authoring workflow: patch, sign, migrate
