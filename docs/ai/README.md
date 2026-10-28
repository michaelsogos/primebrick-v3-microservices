# AI / agent documentation (microservices umbrella)

These files help humans and agents collaborate consistently on the
**Primebrick microservices umbrella repo** (`primebrick-us-v3`).

| File | Role |
|------|------|
| [`dev-server.md`](./dev-server.md) | Dev-server lifecycle & process ownership — empirical ownership check, ask-first for user-owned servers, per-service port table (3003–3007) |
| [`env-policy.md`](./env-policy.md) | Closed environment policy — `.env` limited to `DATABASE_URL` + `DATABASE_SCHEMA`; everything else in `config_entries` |
| [`enforcement-over-verification.md`](./enforcement-over-verification.md) | Enforcement-over-verification doctrine — behavior is enforced by code/types/builders/validators, tests prove it |
| Root [`../../AGENTS.md`](../../AGENTS.md) | Project facts, commands, and pointers |
| [`always-check-rules-first.md`](./always-check-rules-first.md) | Always Check Rules Before Action |
| [`api-path-conventions.md`](./api-path-conventions.md) | API Path Conventions |
| [`code-guardrails.md`](./code-guardrails.md) | Code Execution Guardrails |
| [`controller-boundary.md`](./controller-boundary.md) | Controller Boundary (MVC transport layer) |
| [`cross-repo-release-order.md`](./cross-repo-release-order.md) | Cross-Repo Release Ordering |
| [`dal-usage.md`](./dal-usage.md) | DAL Usage — ONE way only |
| [`data-model-conventions.md`](./data-model-conventions.md) | Data Model Conventions |
| [`db-patches.md`](./db-patches.md) | Database Patches (db-meta + migration engine) |
| [`docs-audience.md`](./docs-audience.md) | Documentation Audience (3 tiers) |
| [`docs-dev-guide.md`](./docs-dev-guide.md) | Developer Documentation |
| [`docs-order.md`](./docs-order.md) | Documentation Page Order |
| [`docs-pipeline.md`](./docs-pipeline.md) | Documentation Pipeline (trigger-based, end to end) |
| [`docs-sync-on-close.md`](./docs-sync-on-close.md) | Sync Docs on GitFlow Close |
| [`docs-user-pages.md`](./docs-user-pages.md) | End-User Page Structure (docs/user-guide) |
| [`file-operations.md`](./file-operations.md) | File Operations |
| [`internal-client.md`](./internal-client.md) | Internal HTTP Client (mandatory) |
| [`logging-telemetry.md`](./logging-telemetry.md) | Logging & Telemetry |
| [`package-versioning.md`](./package-versioning.md) | Fixed Package Versions (No Ranges) |
| [`pre-implementation-anatomy.md`](./pre-implementation-anatomy.md) | ⚠️ MANDATORY before remote-page or form-metadata work — reference lock, contract read, allocation check, contract E2E, host-rendered evidence |
| [`temp-files.md`](./temp-files.md) | Temporary Files Location |
| [`verify-file-creation.md`](./verify-file-creation.md) | Verify File Creation (Prevent Truncated Filename Bug) |
| [`workflow.md`](./workflow.md) | Devin Workflow Rule: Tic-Toc Planning |

Per-service docs live inside each service folder: `<service>/docs/dev-guide/`
(ai, emailsender, webhook, job-handler, crm) — NOT in the root
`docs/dev-guide/` tree.

**Start here for agents:** read root `AGENTS.md`, then this index.
