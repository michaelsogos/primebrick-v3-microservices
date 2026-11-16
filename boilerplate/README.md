# primebrick-boilerplate

Clone source for new `primebrick-us-v3` microservices. **Not a runnable
service** — `src/index.ts` exits immediately unless `--emit-docs` is
passed (see the guard block at the top of `main()`).

## Use it

```bash
cp -r boilerplate <new-svc>
# rename <boilerplate> → <new-svc> everywhere (see docs/dev-guide/index.mdx)
# delete the guard block in src/index.ts
pnpm install && pnpm test && pnpm dev
```

Everything inside is real, current convention: `createMicroservice` boot,
`DomainService` entity writes, `makeServiceRoutes` single declaration,
signed `db-meta` patches, `.devin/check-standards.json` governance,
vitest, `docs/dev-guide` page, Dockerfile, deploy/version-sync scripts.

Full story: `docs/dev-guide/index.mdx` — checklist:
`../docs/dev-guide/adding-a-service.mdx`.
