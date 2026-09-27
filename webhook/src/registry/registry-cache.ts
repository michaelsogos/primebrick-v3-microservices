/**
 * In-memory service-registry cache — fed by service.* lifecycle events
 * (self-healing, no TTL) with a `service.registry.get` req/reply fallback
 * for cold start / misses / negative states.
 *
 * `is_enabled` is NOT carried by lifecycle payloads (it lives only in
 * the registry table, toggled by admins on BE) — so any lookup whose
 * cached state is not a positive `online` falls back to the authoritative
 * registry row, which also confirms enablement.
 */

import {
  NatsClient,
  SERVICE_SUBJECTS,
  type ServiceRegisterPayload,
  type ServiceHeartbeatPayload,
  type ServiceUnregisterPayload,
  type ServiceStalePayload,
} from "@primebrick/sdk";

export interface RegistryLookup {
  /** The service is known, enabled, and reachable → routable. */
  routable: boolean;
  /** Present when the service is known (even if not routable). */
  code?: string;
  /** Human-readable reason when not routable (for RFC7807 detail). */
  reason?: string;
}

interface CacheEntry {
  status: "online" | "going_live" | "offline" | "stale";
}

const cache = new Map<string, CacheEntry>();

interface RegistryRow {
  code: string;
  is_enabled?: boolean;
  status?: string;
}

function deriveStatus(p: { http_healthy: boolean; nats_connected: boolean }): CacheEntry["status"] {
  if (p.http_healthy && p.nats_connected) return "online";
  if (!p.http_healthy && !p.nats_connected) return "offline";
  return "going_live";
}

/**
 * Subscribe to service lifecycle events. Call once at boot, after the
 * NATS connection is established.
 */
export async function startRegistryCache(): Promise<void> {
  await NatsClient.subscribe<ServiceRegisterPayload>(SERVICE_SUBJECTS.REGISTER, async (p) => {
    cache.set(p.code, { status: deriveStatus(p) });
  });
  await NatsClient.subscribe<ServiceHeartbeatPayload>(SERVICE_SUBJECTS.HEARTBEAT, async (p) => {
    cache.set(p.code, { status: deriveStatus(p) });
  });
  await NatsClient.subscribe<ServiceUnregisterPayload>(SERVICE_SUBJECTS.UNREGISTER, async (p) => {
    cache.delete(p.code);
  });
  await NatsClient.subscribe<ServiceStalePayload>(SERVICE_SUBJECTS.STALE, async (p) => {
    const e = cache.get(p.code);
    if (e) e.status = "stale";
  });
  console.log("[webhook] Subscribed to service lifecycle events (registry cache)");
}

async function fetchRegistryRow(code: string): Promise<RegistryRow | null> {
  return NatsClient.request<RegistryRow>("service.registry.get", { code }, 3000);
}

/**
 * Resolve a service code to a routing decision. Positive cache hits are
 * served from memory; everything else is confirmed against BE.
 */
export async function lookupService(code: string): Promise<RegistryLookup> {
  const entry = cache.get(code);
  if (entry?.status === "online") {
    return { routable: true, code };
  }
  try {
    const row = await fetchRegistryRow(code);
    if (!row) return { routable: false, reason: `unknown service "${code}"` };
    if (row.is_enabled === false) {
      return { routable: false, code, reason: `service "${code}" is disabled` };
    }
    if (row.status && row.status !== "online") {
      return { routable: false, code, reason: `service "${code}" is ${row.status}` };
    }
    cache.set(code, { status: "online" });
    return { routable: true, code };
  } catch {
    return {
      routable: false,
      reason: `registry lookup failed for service "${code}"`,
    };
  }
}
