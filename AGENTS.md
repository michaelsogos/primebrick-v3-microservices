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
| **primebrick-v3-sdk** (SDK) | GitHub Actions | GitFlow: create release → close → merge to `main` + tag → CI publishes to npm |
| **primebrick-v3-dal** (DAL) | GitHub Actions | GitFlow: create release → close → merge to `main` + tag → CI publishes to npm |
| **primebrick-v3-docs** | Cloudflare Worker CI | Push to `main` — auto-deploys |
| **primebrick-v3-website** | Cloudflare Worker CI | Push to `main` — auto-deploys |

## Microservices Stack & Architecture Rules
1. **Tech Stack**: Node.js, Fastify (or Express), TypeScript, and pnpm.
2. **Strict Typing**: Use strict TypeScript. Avoid `any` at all costs. Define precise interfaces for DTOs, Requests, and Responses.
3. **Isolation & Autonomy**: Every microservice inside this repository must be 100% self-contained. Do not write hardcoded cross-service relative imports.
4. **Shared Code**: If multiple microservices need to share common utilities, types, or SDKs, they must be isolated in a dedicated shared package within this repository (e.g., using pnpm workspaces if needed).
5. **API Contracts**: Maintain clear and strict API contracts (or schemas) for inter-service communication.
6. **Async Code**: Use `async/await` syntax exclusively. Always handle errors with clean `try/catch` blocks. Never silence caught errors.
7. **Environment**: Never commit `.env` files. Provide a `.env.example` file specifying all required configuration variables.
8. **API Path Conventions (MANDATORY)**: All HTTP routes MUST follow the standardized path conventions. Entity CRUD routes use `/api/v1/entities/:entity/...`, service actions use `/api/v1/actions/:action`, webhooks use `/webhook`. See [.devin/rules/api-path-conventions.md](./.devin/rules/api-path-conventions.md) for the full specification. This is required for the BE MCP Server generic tool dispatch to work.

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

## User-facing documentation

User-facing developer documentation lives in `docs/user-guide/` as MDX files.
These are synced to `docs.primebrick.dev` by the docs repo's CI pipeline.

- **Location**: `docs/user-guide/*.mdx` — one file per topic
- **Ordering**: `docs/user-guide/_order.json` defines the sidebar page order
- **Conventions**: see `.devin/rules/docs-user-guide.md` for editorial rules
- **Mermaid**: use `<Mermaid chart={...} />`, never ` ```Code ` or ` ```mermaid `
- **Do NOT hand-edit** files in `docs/ai/` or `docs/skills/` — those are internal
- **Internal docs** (`docs/ai/`, `docs/skills/`, `docs/gitflow.md`) are NOT synced
  to the docs site — they stay in this repo for AI agents only
