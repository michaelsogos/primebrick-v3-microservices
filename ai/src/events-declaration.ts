/**
 * Emitted-event self-declaration — persisted verbatim in
 * service_registry.endpoints.events and served on /modules (never
 * access-filtered: it is a domain vocabulary, not a route surface).
 *
 * Declared subjects are what THIS service publishes — subscriptions are
 * declared nowhere (decoupled by design). Dynamic tail segments use the
 * NATS `*` single-token wildcard.
 *
 * `jobs.result.ai.<job>` — JetStream result of a partition-maintenance job
 *   run (controllers/nats-sub/partition-jobs.ts). The job name is a
 *   per-job token — today only `partition-maintenance`, future partition
 *   jobs publish under the same template.
 */
import type { ModuleEventsDecl } from "@primebrick/sdk";

export const AI_EVENTS: ModuleEventsDecl = {
  emits: [{ subject: "jobs.result.ai.*" }],
};
