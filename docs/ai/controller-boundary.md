
# Devin Rule: Controller Boundary (MVC transport layer)

> Canonical body of `.devin/rules/controller-boundary.md` — the rule file is a pointer to this page.

## Trigger
- Applies to ALL code in `src/controllers/` (per microservice: `<us>/src/controllers/`) (http/, nats-sub/;
  NATS req/res is banned — sync replies use `callNats`/`makeNatsRequestRoute`), and to any file
  handling an HTTP request or NATS subscription.

## Architecture

```
src/
  controllers/            # transport adapters ONLY — no business logic
    http/                 # HTTP route handlers
    nats-sub/             # includes governed correlation-reply request routes
    nats-sub/             # NATS pub/sub + JetStream subscribers
    #                    # EVERY inbound NATS route/subscriber runs TWO layers:
    #                    # 1) client shield (UA+key vs client_shield_registry) — governs
    #                    #    WHO may publish; 2) user shield (gateway secret +
    #                    #    AuthUser + RBAC) — governs WHICH actor accesses the
    #                    #    resource. Use makeNatsRoutes/makeNatsRequestRoute
    #                    # (shield-first built in) or subscribeShielded for
    #                    #    broadcasts. Raw NatsClient.subscribe on shared
    #                    #    subjects is a security gap.
  services/               # transport-agnostic business logic
```

## Controller contract

A controller MAY:
- authenticate (session JWT / API key / gateway-resolved NATS headers)
- validate the incoming payload (zod / shape checks)
- call exactly ONE service method
- shape the *transport* response: HTTP status + RFC7807 body / NATS reply
  envelope / JetStream ack semantics
- own the root try/catch that maps service errors to the transport
- stream / file download where the transport requires it

A controller MUST NOT:
- import the DAL / repositories directly
- contain domain rules (reserved checks, existence policy, value coercion)
- loop over entities applying per-item business logic
- build response payloads field-by-field — services return the formed
  snake_case shape; the controller only serializes it
- invent error codes — errors come from the service layer
  (`mapDalError` / `ApiError`); the controller only maps them to transport

## Service contract

Services are pure `(validatedInput, ctx) → result | throw`:
- zero `req`/`res`/Msg imports — no transport types
- `ctx` carries actor, permissions, correlation id — assembled by the
  controller
- the same service must be callable identically from http/ and nats-sub/
  controllers

## Why

One operation must be invocable over HTTP and NATS pub/sub without
duplicating auth/validation/dispatch — only the controller file changes,
the service is untouched. (NATS req/res was benchmarked and rejected:
~1.5× slower than the HTTP proxy, no durability/ordering, identical auth
code-flow when done correctly.)

## Deep dive

The normative rules live here; the full mechanics and rationale are in `docs/dev-guide/conventions.mdx` — link, do not duplicate.
