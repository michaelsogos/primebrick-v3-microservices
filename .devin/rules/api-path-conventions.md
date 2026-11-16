---
trigger: always_on
---

# Devin Rule: API Path Conventions

## Trigger
- Applies to ALL code in this repository that defines HTTP routes, OpenAPI specs,
  or route handlers. This includes every microservice under `primebrick-us-v3/`.

## Canonical doc
**`docs/ai/api-path-conventions.md` — read it before acting.** This file is a
pointer; the normative text lives in the canonical doc.

## Enforcement
- AI agent MUST use the `/api/v1/entities/:entity/...` pattern for ALL
  new entity CRUD routes.
- AI agent MUST use `/api/v1/actions/:action` for non-CRUD business actions.
- AI agent MUST NOT create entity routes outside the `/api/v1/entities/` prefix.
- AI agent MUST NOT use plural entity names in paths (always singular).
- AI agent MUST NOT use camelCase in path segments (always snake_case).
- AI agent MUST declare `summary` and `description` in every route's
  `openapi` block so the emitted spec documents every operation —
  `operationId` is auto-derived from method + path, never hand-written.
- AI agent MUST wire the service's HTTP surface through
  `makeServiceRoutes({ info, entities, rpc })` — ONE declaration produces
  both the routers and `/api/v1/openapi.json`; the spec can never drift
  from the registered routes. The handler's `.spec` is embedded in the
  docs pack emitted by `bun src/index.ts --emit-docs`. Never hand-compose
  `buildOpenApiSpec`/`entityCrudSpec`/`makeOpenApiHandler` separately —
  that reintroduces a second source of truth.
- When reviewing existing code, flag any entity route that does not follow
  the `/api/v1/entities/:entity/...` pattern as a violation.
- When creating a new microservice, the entity CRUD pattern is the DEFAULT
  — deviations require explicit user approval.
