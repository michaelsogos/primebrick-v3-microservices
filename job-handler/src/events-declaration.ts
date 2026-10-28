/**
 * Emitted-event self-declaration — persisted verbatim in
 * service_registry.endpoints.events and served on /modules (never
 * access-filtered: it is a domain vocabulary, not a route surface).
 *
 * `jobs.ctl.rules.changed` — JetStream signal that the job_rule set
 *   changed (modules/jobs/jobs.service.ts); the rules-engine consumer
 *   re-arms schedules on it.
 *
 * NOTE: `jobs.due.<lane>.*` subjects are published BY NATS itself at
 *   schedule fire-time — they are the due-lane target vocabulary, not
 *   module emits. `jobs.ctl.schedule.request` is a callNats RPC subject,
 *   not an event.
 */
import type { ModuleEventsDecl } from "@primebrick/sdk";

export const JOB_EVENTS: ModuleEventsDecl = {
  emits: [
    {
      subject: "jobs.ctl.rules.changed",
      label_key: "job.events.rules_changed.name",
      description_key: "job.events.rules_changed.desc",
    },
  ],
};
