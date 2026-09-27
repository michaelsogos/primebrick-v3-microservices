/**
 * In-memory TTL cache over `NatsApiKeyPort` — the webhook service's
 * AUTHENTICATED_API precheck without a database and (mostly) without
 * per-request NATS traffic.
 *
 * First verification of a key → one `auth.apikey.byHash` req/reply to BE
 * (which itself is Redis-cached). Subsequent verifications within the
 * TTL → zero traffic. A revoked key stays accepted at most
 * `WEBHOOK_AUTH_CACHE_TTL_MS` — acceptable because this is only the
 * first wall; the target US re-verifies the key + RBAC on every message.
 *
 * Negative results (unknown key) are cached too, with a shorter TTL,
 * so a wrong key can't be used to NATS-flood the BE.
 */

import {
  NatsApiKeyPort,
  type ApiKeyPort,
  type ApiKeyRecord,
} from "@primebrick/sdk";

const POSITIVE_TTL_MS = 60_000;
const NEGATIVE_TTL_MS = 10_000;
const MAX_ENTRIES = 1000;

interface CacheEntry {
  record: ApiKeyRecord | null;
  expires_at_ms: number;
}

export class CachedApiKeyPort implements ApiKeyPort {
  private cache = new Map<string, CacheEntry>();
  private inner: ApiKeyPort;

  constructor(inner?: ApiKeyPort) {
    this.inner = inner ?? new NatsApiKeyPort(3000);
  }

  async findByHash(hash: string): Promise<ApiKeyRecord | null> {
    const now = Date.now();
    const hit = this.cache.get(hash);
    if (hit && hit.expires_at_ms > now) return hit.record;

    const record = await this.inner.findByHash(hash);
    if (this.cache.size >= MAX_ENTRIES) {
      // Evict the oldest insertion (Map preserves insertion order).
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(hash, {
      record,
      expires_at_ms: now + (record ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS),
    });
    return record;
  }
}
