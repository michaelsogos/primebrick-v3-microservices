# Devin Rule: Documentation Page Order

## Trigger
- Applies whenever AI agent creates or deletes a page in `docs/dev-guide/`.

## Actions
1. When creating a new `.mdx` page, add its slug to `docs/dev-guide/_order.json`
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
    "adding-a-service"
  ]
}
```

## Per-service pages
This repo is a multi-service monorepo. Per-service docs live inside the
service folder itself — **`<service>/docs/dev-guide/index.mdx`** (plus
optional sibling pages, each with its own `_order.json`), NOT in the
root `docs/dev-guide/` tree. The root tree holds only shared pages
(`overview`, `architecture`, `conventions`, `adding-a-service`).

Each service's `_order.json` (`<service>/docs/dev-guide/_order.json`)
defines its own sidebar order; `index.mdx` is the service landing page.

The API reference is NOT an MDX page — it is handled by Zudoku's interactive
API Catalog, fed by the docs repo's `fetch-openapi.mjs` script at build time.

The service folder name is the doc slug (e.g. `emailsender`), NOT the
package name.
