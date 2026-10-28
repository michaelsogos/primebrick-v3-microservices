/**
 * Emitted-event self-declaration — persisted verbatim in
 * service_registry.endpoints.events and served on /modules (never
 * access-filtered: it is a domain vocabulary, not a route surface).
 *
 * `webhook.<serviceCode>.received` — durable JetStream envelope for an
 *   inbound webhook addressed to a service (controllers/http/router.ts:
 *   `${SUBJECT_PREFIX}.${serviceCode}.${SUBJECT_SUFFIX}`). serviceCode is
 *   a dynamic single token, hence the `*` wildcard.
 */
import type { ModuleEventsDecl } from "@primebrick/sdk";

export const WEBHOOK_EVENTS: ModuleEventsDecl = {
  emits: [{ subject: "webhook.*.received" }],
};
