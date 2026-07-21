---
trigger: always_on
---

# Devin Rule: API Path Conventions

## Trigger
- Applies to ALL code in this repository that defines HTTP routes, OpenAPI specs,
  or route handlers. This includes every microservice under `primebrick-us-v3/`.

## Purpose

Primebrick microservices are proxied by the Backend (BE) via `/ws/:serviceCode/*`
and are consumed by:
1. The Frontend (FE) — direct UI interactions
2. The MCP Server (inside the BE) — generic CRUD tools that dispatch based on
   `module` + `entity` using a **predictable path template**

For the MCP Server's generic tool dispatch to work without per-entity path
configuration, ALL microservices MUST follow the same API path conventions.

## Path Categories

Every HTTP endpoint in a microservice falls into exactly ONE of these
categories. The category determines the path structure.

### Category 1: Entity CRUD (`/api/v1/entities/:entity/...`)

Any resource that is a database-backed entity with standard CRUD lifecycle
(list, get, create, update, soft-delete, restore, audit) MUST use the
entity CRUD path pattern:

```
GET    /api/v1/entities/:entity/meta              → entity metadata (fields, types, validation)
GET    /api/v1/entities/:entity/list              → paginated list with search/filter/sort
GET    /api/v1/entities/:entity/:uuid             → single record by UUID
POST   /api/v1/entities/:entity                   → create new record
PUT    /api/v1/entities/:entity/:uuid             → update record by UUID
DELETE /api/v1/entities/:entity/:uuid             → soft-delete record by UUID
POST   /api/v1/entities/:entity/:uuid/restore     → restore soft-deleted record
GET    /api/v1/entities/:entity/:uuid/audit       → audit history for record
POST   /api/v1/entities/:entity/bulk-delete       → bulk soft-delete (array of UUIDs)
POST   /api/v1/entities/:entity/bulk-restore      → bulk restore (array of UUIDs)
```

Rules:
- `:entity` is the snake_case plural noun (e.g. `providers`, `templates`,
  `config_entries`, `sender_logs`). NEVER singular, NEVER camelCase.
- `:uuid` is always the UUID path parameter.
- Not all entities support all operations. Unsupported operations simply do
  not register that route. The OpenAPI spec MUST only list operations that
  are actually implemented.
- The `meta` endpoint returns the entity's field schema (same structure as
  the BE's `*.meta.ts` exports). This is consumed by the MCP `get_entity_meta`
  tool and by the FE for dynamic form generation.
- The `list` endpoint MUST accept the standard query parameters:
  `search`, `search_in`, `sort_key`, `sort_dir`, `page`, `page_size`,
  `filters`, `deleted_records`. See the BE's customer/organization list
  endpoints for the reference implementation.

### Category 2: Service Actions (`/api/v1/actions/:action`)

Endpoints that perform a business action that is NOT a CRUD operation on a
single entity (e.g. "send email", "test provider connection", "sync data").

```
POST   /api/v1/actions/send-email                 → send an email using a template
POST   /api/v1/actions/test-provider-connection   → test a provider's API key
```

Rules:
- `:action` is a snake_case verb-noun describing the action.
- These endpoints are NOT exposed as MCP tools (they are not generic CRUD).
- They MAY be exposed as specific MCP tools in the future if the action is
  useful for AI agents.

### Category 3: Webhooks (`/webhook` or `/webhook/:identifier`)

Endpoints that receive external callbacks (e.g. Brevo delivery events).

```
POST   /webhook                                    → webhook receiver (API key auth)
POST   /webhook/brevo                              → Brevo-specific webhook
```

Rules:
- Webhooks use API key authentication, NOT JWT. They are outside the MCP
  scope entirely.
- Webhook paths do NOT use the `/api/v1/` prefix.

### Category 4: System / Health (`/api/v1/system/...`, `/health`)

```
GET    /health                                     → health check (public, no auth)
GET    /api/v1/openapi.json                        → OpenAPI spec (public, no auth)
GET    /api/v1/system/info                         → service info (authenticated)
```

Rules:
- `/health` is always public and returns `{ ok: true, service: "<code>" }`.
- `/api/v1/openapi.json` is always public and returns the OpenAPI 3.x spec.
- System endpoints are for infrastructure/monitoring, not entity operations.

## OpenAPI Spec Requirements

Every microservice MUST export a complete OpenAPI 3.x spec at
`GET /api/v1/openapi.json`. The spec MUST:

1. List ALL implemented routes (entity CRUD, service actions, webhooks, system).
2. Use `operationId` in snake_case for every operation (e.g. `list_providers`,
   `get_provider`, `create_provider`). This is used by the MCP Server for
   tool name generation.
3. Include `tags` grouping operations by entity or category.
4. Include `summary` and `description` for every operation — these are used
   by the MCP Server to generate human-readable tool descriptions for LLMs.
5. Include request/response schemas with `snake_case` field names.
6. For entity CRUD operations, tag them with the entity name so the BE's
   OpenAPI aggregator can group them correctly.

## What NOT to do

- ❌ `/api/v1/providers` (no `/entities/` prefix) — use
  `/api/v1/entities/providers/list` instead
- ❌ `/api/v1/providers/:uuid` — use `/api/v1/entities/providers/:uuid`
- ❌ `/api/v1/sendEmail` (camelCase action) — use
  `/api/v1/actions/send-email`
- ❌ `/api/v1/provider` (singular entity name) — use
  `/api/v1/entities/providers` (plural)
- ❌ Entity routes mixed with action routes under the same path prefix
- ❌ Missing `operationId` in OpenAPI spec
- ❌ Missing `summary`/`description` in OpenAPI spec

## Migration: emailsender

The `emailsender` microservice currently uses non-standard paths. It MUST be
refactored:

| Current path | New path |
|---|---|
| `GET /api/v1/providers` | `GET /api/v1/entities/providers/list` |
| `GET /api/v1/providers/:uuid` | `GET /api/v1/entities/providers/:uuid` |
| `POST /api/v1/providers` | `POST /api/v1/entities/providers` |
| `PUT /api/v1/providers/:uuid` | `PUT /api/v1/entities/providers/:uuid` |
| `DELETE /api/v1/providers/:uuid` | `DELETE /api/v1/entities/providers/:uuid` |
| `GET /api/v1/config` | `GET /api/v1/entities/config_entries/list` |
| `POST /webhook` | `POST /webhook` (no change — Category 3) |

The `sendEmail` function is called via NATS™ (not HTTP) — no path change needed.

## Enforcement

- AI agent MUST use the `/api/v1/entities/:entity/...` pattern for ALL
  new entity CRUD routes.
- AI agent MUST use `/api/v1/actions/:action` for non-CRUD business actions.
- AI agent MUST NOT create entity routes outside the `/api/v1/entities/` prefix.
- AI agent MUST NOT use singular entity names in paths (always plural).
- AI agent MUST NOT use camelCase in path segments (always snake_case).
- AI agent MUST include `operationId`, `summary`, and `description` in every
  OpenAPI operation.
- AI agent MUST update the OpenAPI spec (`openapi-route.ts`) when adding or
  changing routes.
- When reviewing existing code, flag any entity route that does not follow
  the `/api/v1/entities/:entity/...` pattern as a violation.
- When creating a new microservice, the entity CRUD pattern is the DEFAULT
  — deviations require explicit user approval.
