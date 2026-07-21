# Devin Rule: User-Facing Documentation

## Trigger
- Applies whenever AI agent creates or updates files in `docs/user-guide/`.

## Editorial conventions

1. **Audience**: external developers using Primebrick. Not internal team, not
   AI agents. Write as if explaining to a dev who just cloned the repo.
2. **Tone**: direct, technical, no marketing language. "The auth middleware
   validates JWT tokens on every request" — not "Our amazing auth system
   beautifully handles security."
3. **Code examples**: always complete and runnable. Show imports, show
   context. Never partial snippets that won't compile.
4. **Diagrams**: use `<Mermaid chart={...} />` component (Zudoku client-side
   rendering). NEVER use ` ```Code ` or ` ```mermaid ` fenced blocks for
   Mermaid — they will not render on the docs site.
5. **Structure**: each page has:
   - Frontmatter: `title`, `description`
   - H2 sections with clear headings
   - Code examples in fenced blocks with correct language tags
   - "Next steps" links at the bottom to related pages
6. **Language**: English only (per AGENTS.md).
7. **Incremental updates**: when updating an existing page, preserve the
   existing prose structure. Make minimal edits. Do NOT rewrite the entire
   page unless the source code has fundamentally changed.
8. **Marked sections**: blocks wrapped in `<!-- AUTO-GENERATED:reference -->`
   ... `<!-- END -->` contain extracted API facts. Update these from the
   extraction JSON. Never modify prose outside these blocks unless the
   underlying concept has changed.

## Per-service page convention

This repo is a multi-service monorepo. Documentation is organized as one
page per microservice plus a small set of shared pages.

```
docs/user-guide/
  _order.json
  overview.mdx              # repo overview, microservices list, architecture
  architecture.mdx          # NATS™ bus, BE proxy, SDK lifecycle (shared)
  conventions.mdx           # API path conventions, data model rules (shared)
  services/
    <service>.mdx           # one prose guide page per microservice
```

- **Guide pages** (`services/<service>.mdx`) are AI-written prose —
  architecture, NATS™ subjects, entities, providers, deployment, lifecycle.
  They link to Zudoku's interactive API Catalog for the full operation list
  instead of duplicating it: `See the [API Catalog](/catalog/<service>) for
  the full operation list.`
- **API reference** is NOT an MDX page. The OpenAPI specs are extracted by
  the docs repo's `fetch-openapi.mjs` script at build time, which scans the
  shallow-cloned repos for `openapi-route.ts` files and writes them to
  `apis/<service>.json` for Zudoku's interactive API Catalog.
- **Shared pages** (`overview`, `architecture`, `conventions`) cover
  cross-cutting topics: the NATS™ message bus, the BE `/ws/:serviceCode/*`
  proxy, the SDK lifecycle, API path conventions, data-model rules.
- **Per-service pages** (`services/<service>.mdx`) cover everything
  specific to one microservice: its HTTP routes, NATS™ subjects, entities,
  providers, service actions, deployment config, and health behavior.
- When a microservice changes, update ONLY its `services/<service>.mdx`
  page (plus a shared page only if a cross-cutting topic changed).
- When creating a new service page, add its slug
  (`services/<service>`) to `_order.json` (see `.devin/rules/docs-order.md`).
- The `<service>` slug is the microservice's sub-folder name
  (e.g. `emailsender`), NOT its package name
  (`primebrick-emailsender`).

## Forbidden
- ❌ ` ```Code ` blocks for Mermaid diagrams
- ❌ ` ```mermaid ` fenced blocks (use `<Mermaid chart={...} />` instead)
- ❌ Rewriting unchanged pages (creates git diff churn)
- ❌ Inventing APIs, props, or endpoints not in the extraction JSON or code
- ❌ Marketing language or superlatives
- ❌ Putting per-service route/NATS™/entity details on a shared page —
  those belong on `services/<service>.mdx`
- ❌ Putting cross-cutting topics (NATS™ bus, BE proxy, API conventions) on
  a per-service page — those belong on the shared pages
