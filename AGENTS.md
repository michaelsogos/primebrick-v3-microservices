# AI AGENT INSTRUCTIONS - Primebrick Microservices

## ⚠️ CRITICAL: NEVER COMMIT AUTOMATICALLY
**AI agents MUST NEVER commit changes without explicit user instruction.**
- WAIT for the user to explicitly tell you to commit before running any `git commit` command.
- This applies to ALL situations - no exceptions.

## Repository overview
Independent Git repository containing the distributed microservices part of the Primebrick v3 Backend.
**Documentation language:** All `*.md` files must use **English** for team-facing prose.

## CI / Deployment

**This repo has NO auto-deploy CI. Deployment follows GitFlow.**

Pushing to `develop` or feature branches is fine for development, but deployment
only happens when a release branch is created, closed, and merged to `main` with
a version tag. There is no CI pipeline that auto-deploys on push.

### Primebrick CI/Deployment overview (all repos)

| Repo | CI/Deployment | Process to deploy |
|------|--------------|-------------------|
| **primebrick-v3-microservices** (this repo) | No auto-deploy CI | GitFlow: create release branch → close → merge to `main` + tag |
| **primebrick-v3-backend** (BE) | No auto-deploy CI | GitFlow: create release branch → close → merge to `main` + tag |
| **primebrick-v3-frontend** (FE) | No auto-deploy CI | GitFlow: create release branch → close → merge to `main` + tag |
| **primebrick-v3-sdk** (SDK) | GitHub™ Actions | GitFlow: create release → close → merge to `main` + tag → CI publishes to npm |
| **primebrick-v3-dal** (DAL) | GitHub™ Actions | GitFlow: create release → close → merge to `main` + tag → CI publishes to npm |
| **primebrick-v3-docs** | Cloudflare® Worker CI | Push to `main` — auto-deploys |
| **primebrick-v3-website** | Cloudflare® Worker CI | Push to `main` — auto-deploys |

## Microservices Stack & Architecture Rules
1. **Tech Stack**: Node.js®, Fastify (or Express), TypeScript®, and pnpm.
2. **Strict Typing**: Use strict TypeScript®. Avoid `any` at all costs. Define precise interfaces for DTOs, Requests, and Responses.
3. **Isolation & Autonomy**: Every microservice inside this repository must be 100% self-contained. Do not write hardcoded cross-service relative imports.
4. **Shared Code**: If multiple microservices need to share common utilities, types, or SDKs, they must be isolated in a dedicated shared package within this repository (e.g., using pnpm workspaces if needed).
5. **API Contracts**: Maintain clear and strict API contracts (or schemas) for inter-service communication.
6. **Async Code**: Use `async/await` syntax exclusively. Always handle errors with clean `try/catch` blocks. Never silence caught errors.
7. **Environment**: Never commit `.env` files. Provide a `.env.example` file specifying all required configuration variables.
8. **API Path Conventions (MANDATORY)**: All HTTP routes MUST follow the standardized path conventions. Entity CRUD routes use `/api/v1/entities/:entity/...`, service actions use `/api/v1/actions/:action`, webhooks use `/webhook`. See [.devin/rules/api-path-conventions.md](./.devin/rules/api-path-conventions.md) for the full specification. This is required for the BE MCP Server generic tool dispatch to work.
9. **MVC transport layout (MANDATORY)**: Transport adapters live under `src/controllers/` (`http/`, `nats-sub/`; NATS req/res is banned — `NatsClient.request`/`subscribeRequest` were removed, sync replies use governed `callNats`/`makeNatsRequestRoute` correlation) and contain NO business logic — auth, payload validation, ONE service call, transport response only. Business logic lives in `src/services/` and must be callable identically from any transport. See [.devin/rules/controller-boundary.md](./.devin/rules/controller-boundary.md).
10. **Webhook ingress**: External S2S webhooks NEVER hit a business microservice directly — they go through the `webhook` service (`primebrick-webhook`), a DB-less registration-driven router: `POST /webhook/{service_code}/{intent...}` → API-key precheck (401 wall) → JetStream `webhook.<code>.received` → the target US consumes via a durable `nats-sub` controller and runs its own auth + RBAC. A new US becomes routable by registering normally — no `webhook` release needed.
11. **Route handlers are factory-produced (MANDATORY)**: every HTTP route MUST be declared as `RpcRoute[]` and mounted via the SDK's `makeRpcRouter` (plus `makeOpenApiHandler` for `/api/v1/openapi.json`, `composeRouteHandlers` to chain). `createMicroservice` REJECTS the boot when `routeHandler` is not factory-produced (runtime brand check) — arbitrary `(req, res, url) => boolean` functions do not exist in this repo. Auth (`"user"` gateway-resolved / `"api_key"` / `"public"`), RBAC `permissions` (mandatory on non-public routes), body validation and RFC 7807 errors come from the factory — never hand-rolled.
12. **NATS queue groups (MANDATORY)**: `NatsClient.subscribe`/`subscribeRequest` take `{ queue }` on every WORK subject (one replica processes each message — e.g. `emailsender.send` → `{ queue: "emailsender" }`). Broadcast subjects EVERY instance must receive (lifecycle events like `service.gateway_online`, `config.changed`, `client_shield_registry.changed`, registry-cache feeds) stay unqueued. JetStream consumers keep their durable identity — no queue needed.
13. **Env policy (MANDATORY)**: the ONLY env-sourced settings are `DATABASE_URL` + `DATABASE_SCHEMA` (closed-set validated by `assertDbEnv()` — unknown `DB_*`/`DATABASE_*` keys crash boot). `DATABASE_SCHEMA` declares the service's owned PG schema: it drives the DAL `schemas` domain (entity guard rejects tables outside it), the `search_path`, and the `service.register` schema claim in `service_registry`. All runtime config lives in `{schema}.config_entries` (loaded via `ConfigLoader` / the service's config holder) — `service_code`, `http_port`, `service_base_url`, `nats_url`, provider keys, feature flags. Never read `process.env` for runtime settings.

## Commands

| Action | Command |
|--------|---------|
| Install | `pnpm install` |
| Build | `pnpm run build` |
| DB migrate (per microservice) | `cd <microservice> && pnpm run db:migrate` |

## Database patches

Each microservice has its own `db-meta/patches/` directory and uses `@primebrick/sdk`'s `applyPatches()` runner via `bun scripts/database-patch-apply.ts`.

If `db:migrate` fails with "exists in registry with a different content_sha256", see
[.devin/rules/patch-sha256-management.md](./.devin/rules/patch-sha256-management.md).
**Never create a new initial patch** — update the existing one in place and create a
fire-and-forget script to update the registry hash on existing databases.

## Package Versioning — FIXED versions only (MANDATORY)

All package versions in `package.json` MUST be pinned to exact versions (e.g.
`"typescript": "5.9.3"`). NO ranges (`^`, `~`, `>=`, `*`, `latest`) are allowed
for registry packages. This ensures every dev machine, CI build, and production
rebuild gets the exact same dependency tree that was tested during UAT.

See [.devin/rules/package-versioning.md](./.devin/rules/package-versioning.md)
for the full rule and upgrade procedure.

## GitFlow rules
This repository follows GitFlow. AI agents MUST follow these rules.
Ensure you follow branch management, version tagging, and commit protocols.

## Documentation (3 tiers — see `.devin/rules/docs-audience.md`)

Developer documentation lives in `docs/dev-guide/` (shared pages) and
`<service>/docs/dev-guide/` (per-service pages) as MDX files. These are
synced to `docs.primebrick.dev` under the dev section — never ingested
into the end-user AI KB.

- **Shared pages**: `docs/dev-guide/{overview,architecture,conventions}.mdx`
- **Per-service pages**: `<service>/docs/dev-guide/index.mdx` — each
  microservice owns and ships its own docs
- **Ordering**: `docs/dev-guide/_order.json` defines the sidebar page order
- **Conventions**: see `.devin/rules/docs-dev-guide.md` for editorial rules
- **Mermaid**: use `<Mermaid chart={...} />`, never ` ```Code ` or ` ```mermaid `
- **Do NOT hand-edit** files in `docs/ai/` or `docs/skills/` — those are internal

## Logging & Telemetry

- Use `logger` from `@primebrick/sdk` — never `console.*` in new code.
- Microservices get async logging + OTel automatically via `createMicroservice`: console bridge first, then `SharedConfig.telemetry` fetch + `config.changed` hot-reload (no process restarts).
- Do NOT duplicate telemetry config in service-local config tables — it is BE-owned (single point).
- See [.devin/rules/logging-telemetry.md](./.devin/rules/logging-telemetry.md).
