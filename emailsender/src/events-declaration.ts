/**
 * Emitted-event self-declaration — persisted verbatim in
 * service_registry.endpoints.events and served on /modules (never
 * access-filtered: it is a domain vocabulary, not a route surface).
 *
 * `emailsender.response.<requestId>` — per-request send outcome
 *   (controllers/nats-sub/email-send.ts). The requestId tail is dynamic,
 *   hence the single-token wildcard.
 *
 * NOTE: `emailsender.send` is published BY THE BACKEND (the request side
 * of this service) — it is not an emit of this service and belongs to
 * the BE's own declaration once the BE gains a registry channel.
 */
import type { ModuleEventsDecl } from "@primebrick/sdk";

export const EMAILSENDER_EVENTS: ModuleEventsDecl = {
  emits: [{ subject: "emailsender.response.*" }],
};
