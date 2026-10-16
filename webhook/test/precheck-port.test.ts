import { describe, it, expect, vi } from "vitest";
import { CachingApiKeyPort } from "@primebrick/sdk";
import type { ApiKeyPort, ApiKeyRecord } from "@primebrick/sdk";

// Webhook wires `new CachingApiKeyPort(new NatsApiKeyPort(3000))` — no
// CachePort, so it runs in bounded in-memory mode (60s positive / 10s
// negative). These tests pin that wiring decision: if a CachePort is ever
// added, negatives stop being cached and the TTLs change.

const RECORD: ApiKeyRecord = {
  uuid: "k1",
  name: "brevo",
  permissions: ["emailsender_log_create_single"],
  is_system: false,
  is_active: true,
  expires_at: null,
};

function fakePort(record: ApiKeyRecord | null): ApiKeyPort & { calls: number } {
  const port = {
    calls: 0,
    async findByHash(_hash: string) {
      port.calls++;
      return record;
    },
  };
  return port;
}

describe("webhook api-key precheck (CachingApiKeyPort, in-memory mode)", () => {
  it("serves repeated lookups from cache (single inner call)", async () => {
    const inner = fakePort(RECORD);
    const port = new CachingApiKeyPort(inner);
    expect(await port.findByHash("h1")).toEqual(RECORD);
    expect(await port.findByHash("h1")).toEqual(RECORD);
    expect(inner.calls).toBe(1);
  });

  it("caches negative results with short TTL", async () => {
    const inner = fakePort(null);
    const port = new CachingApiKeyPort(inner);
    expect(await port.findByHash("bad")).toBeNull();
    expect(await port.findByHash("bad")).toBeNull();
    expect(inner.calls).toBe(1);
  });

  it("re-queries after TTL expiry", async () => {
    vi.useFakeTimers();
    try {
      const inner = fakePort(RECORD);
      const port = new CachingApiKeyPort(inner);
      await port.findByHash("h1");
      vi.advanceTimersByTime(61_000); // > positive TTL (60s)
      await port.findByHash("h1");
      expect(inner.calls).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("negative TTL expires sooner than positive", async () => {
    vi.useFakeTimers();
    try {
      const inner = fakePort(null);
      const port = new CachingApiKeyPort(inner);
      await port.findByHash("bad");
      vi.advanceTimersByTime(11_000); // > negative TTL (10s)
      await port.findByHash("bad");
      expect(inner.calls).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
