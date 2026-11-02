/**
 * callable-catalog — JH-side view of `census.callables`.
 *
 * Fed by `service.register` lifecycle broadcasts (each payload carries the
 * declaring service's `endpoints.callables`, so the catalog self-heals on
 * every registration) with a governed `service.registry.get` census fetch
 * for cold start — the same pattern as webhook's registry-cache, and the
 * sanctioned replacement for reading `public.service_registry` directly
 * (schema sovereignty).
 *
 * Consumed by the job_rule write path: `target_subject` must resolve to a
 * declared callable — the form's `census.callables` combo is the same list
 * rendered for users, so a write the form could not produce is rejected
 * here too.
 */

import {
  subscribeShielded,
  callNats,
  SERVICE_SUBJECTS,
  logger,
  type ServiceRegisterPayload,
  type ServiceUnregisterPayload,
} from "@primebrick/sdk";

/** `{service_code, callables}` rows returned by `service.registry.get {census:"callables"}`. */
interface CensusRow {
  service_code?: string;
  callables?: { subject?: string }[];
}

const catalog = new Map<string, Set<string>>(); // service_code → callable subjects

function indexPayload(p: ServiceRegisterPayload): void {
  const decl = p.endpoints?.["callables"] as { callables?: { subject?: string }[] } | undefined;
  const subjects = new Set<string>();
  for (const c of decl?.callables ?? []) {
    if (typeof c?.subject === "string" && c.subject.length > 0) subjects.add(c.subject);
  }
  catalog.set(p.code, subjects);
}

/**
 * Union of every callable subject declared by live services. Includes a
 * cold-start fetch when the lifecycle-fed map is still empty (first boot
 * race: services registered before this catalog subscribed).
 */
export async function callableSubjects(): Promise<Set<string>> {
  if (catalog.size === 0) {
    try {
      const rows = await callNats<CensusRow[]>("service.registry.get", { census: "callables" }, { timeoutMs: 3000 });
      for (const row of rows ?? []) {
        if (typeof row?.service_code !== "string") continue;
        const subjects = new Set<string>();
        for (const c of row.callables ?? []) {
          if (typeof c?.subject === "string" && c.subject.length > 0) subjects.add(c.subject);
        }
        catalog.set(row.service_code, subjects);
      }
    } catch (err) {
      logger.warn(`callable-catalog: cold-start fetch failed — catalog may be incomplete (${String(err)})`, {
        tags: ["jobs"],
      });
    }
  }
  const all = new Set<string>();
  for (const subjects of catalog.values()) for (const s of subjects) all.add(s);
  return all;
}

/** Subscribe to lifecycle events. Call once at boot, after NATS is up. */
export async function startCallableCatalog(): Promise<void> {
  await subscribeShielded<ServiceRegisterPayload>(SERVICE_SUBJECTS.REGISTER, async (p) => {
    indexPayload(p);
  });
  await subscribeShielded<ServiceUnregisterPayload>(SERVICE_SUBJECTS.UNREGISTER, async (p) => {
    catalog.delete(p.code);
  });
  logger.done("callable-catalog: subscribed to service lifecycle events", { tags: ["jobs"] });
}
