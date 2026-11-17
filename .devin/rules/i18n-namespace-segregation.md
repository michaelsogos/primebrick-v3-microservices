# Devin Rule: i18n Namespace Segregation

## Trigger
- Applies whenever AI agent writes or cites a translation key anywhere in a service: `src/`, `fe/src/`, `db-meta/patches/`, registration payloads (`createMicroservice`), config rows, entity metadata.

## Canonical doc
**`docs/ai/i18n-namespace-segregation.md` — read it before acting.** This file is a
pointer; the normative text lives in the canonical doc.

## Enforcement
- AI agent MUST cite only `app.*` or the service's own `{schema}.*` namespace.
- AI agent MUST NOT cite `system.*`, `custom.*`, or another module's namespace — runtime availability is not permission.
- AI agent MUST keep `i18n_namespaces` at `["app", "{code}"]` in `.devin/check-standards.json`.
- AI agent MUST seed new keys in the service's own `db-meta/patches/` targeting its own schema.
- AI agent MUST use `findTranslations` (matcher-gated) for any cross-namespace read.
