/**
 * Emitted-event self-declaration — persisted verbatim in
 * service_registry.endpoints.events and served on /modules (never
 * access-filtered: it is a domain vocabulary, not a route surface).
 *
 * Declared subjects are what THIS service publishes — subscriptions are
 * declared nowhere (decoupled by design). Dynamic tail segments use the
 * NATS `*` single-token wildcard.
 *
 * `jobs.result.ai.<job>` — JetStream result of a system-job run
 *   (controllers/nats-sub/partition-jobs.ts — the `ai.partition_maintenance`
 *   callable). The job name is a per-job token — today only
 *   `partition_maintenance`, future system jobs publish under the same
 *   template.
 */
import type { ModuleEventsDecl } from "@primebrick/sdk";

export const AI_EVENTS: ModuleEventsDecl = {
  emits: [{ subject: "jobs.result.ai.*" }],
};
