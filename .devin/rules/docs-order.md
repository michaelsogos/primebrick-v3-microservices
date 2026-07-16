# Devin Rule: Documentation Page Order

## Trigger
- Applies whenever AI agent creates or deletes a page in `docs/user-guide/`.

## Actions
1. When creating a new `.mdx` page, add its slug to `docs/user-guide/_order.json`
   in the logical reading position (not at the end, not alphabetically).
2. When deleting a page, remove its slug from `_order.json`.
3. The `_order.json` `pages` array defines the sidebar order on
   docs.primebrick.dev. Pages not listed are appended alphabetically after
   listed pages.
4. `index.mdx` is always excluded — it's the category landing page, not a
   sidebar item.

## _order.json format
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

## Per-service pages
This repo is a multi-service monorepo. Per-service pages live under the
`services/` group, after the shared pages (`overview`, `architecture`,
`conventions`). Each service has ONE prose guide page:
`services/<service>` — the AI-written guide page.

The API reference is NOT an MDX page — it is handled by Zudoku's interactive
API Catalog, fed by the docs repo's `fetch-openapi.mjs` script at build time.

The service slug is the microservice's sub-folder name
(e.g. `emailsender`), NOT its package name. Add new service pages in
logical reading order (typically after existing services).
