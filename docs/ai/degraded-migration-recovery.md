# Degraded migration recovery — operational surface

> Canonical mechanism doc: **`primebrick-v3-sdk` →
> `docs/dev-guide/migrations.mdx` → "Live recovery"**. This page covers
> what a US service operator sees.

## What happens

A failed boot migration does **not** crash the service — it boots
degraded: domain routes return 503, `/health` and
`/api/v1/system/db-migration/*` stay reachable, and the registry row
reports `migration_failed` via `checks.db_migration.ok=false`.

## How it recovers — no respawn needed

- **Automatic**: every heartbeat tick (30 s) the service re-runs the
  migration engine while degraded. Fix the DB (e.g. `pnpm db:migrate` or
  a manifest re-sign) and the service self-heals on the next tick —
  domain routes open, `onReady` runs once (NATS subscriptions, init),
  the callable census re-registers, and the registry row flips to
  `online`.
- **Manual**: the FE `/system/migrations` page issues
  `retry / approve / resolve / drift-check` against the service's
  db-migration routes — same code path, immediate effect.
- **`pending_review` is never auto-approved** — a human must approve via
  the admin surface; the heartbeat retry respects the trust gate.

Respawning the process is **never required** for recovery — the old
"requires respawn" note described a boot-latched gate that no longer
exists.
