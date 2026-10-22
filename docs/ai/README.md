# AI / agent documentation (microservices umbrella)

These files help humans and agents collaborate consistently on the
**Primebrick microservices umbrella repo** (`primebrick-us-v3`).

| File | Role |
|------|------|
| [`dev-server.md`](./dev-server.md) | Dev-server lifecycle & process ownership — empirical ownership check, ask-first for user-owned servers, per-service port table (3003–3007) |
| [`env-policy.md`](./env-policy.md) | Closed environment policy — `.env` limited to `DATABASE_URL` + `DATABASE_SCHEMA`; everything else in `config_entries` |
| [`enforcement-over-verification.md`](./enforcement-over-verification.md) | Enforcement-over-verification doctrine — behavior is enforced by code/types/builders/validators, tests prove it |
| Root [`../../AGENTS.md`](../../AGENTS.md) | Project facts, commands, and pointers |

Per-service docs live inside each service folder: `<service>/docs/dev-guide/`
(ai, emailsender, webhook, job-handler, crm) — NOT in the root
`docs/dev-guide/` tree.

**Start here for agents:** read root `AGENTS.md`, then this index.
