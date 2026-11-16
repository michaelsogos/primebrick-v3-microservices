/**
 * Emitted-event self-declaration — persisted verbatim in
 * service_registry.endpoints.events and served on /modules (never
 * access-filtered: it is a domain vocabulary, not a route surface).
 *
 * The boilerplate emits nothing; on clone declare the subjects this
 * service publishes (e.g. `<code>.<noun>.<verb>` — durable JetStream
 * envelopes or core pub/sub signals).
 */
import type { ModuleEventsDecl } from "@primebrick/sdk";

export const BOILERPLATE_EVENTS: ModuleEventsDecl = {
  emits: [],
};
