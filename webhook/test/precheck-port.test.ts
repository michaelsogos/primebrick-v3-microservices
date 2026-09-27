import { describe, it, expect, vi } from "vitest";
import { CachedApiKeyPort } from "../src/auth/precheck-port.js";
import type { ApiKeyPort, ApiKeyRecord } from "@primebrick/sdk";

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

describe("CachedApiKeyPort", () => {
  it("serves repeated lookups from cache (single inner call)", async () => {
    const inner = fakePort(RECORD);
    const port = new CachedApiKeyPort(inner);
    expect(await port.findByHash("h1")).toEqual(RECORD);
    expect(await port.findByHash("h1")).toEqual(RECORD);
    expect(inner.calls).toBe(1);
  });

  it("caches negative results with short TTL", async () => {
    const inner = fakePort(null);
    const port = new CachedApiKeyPort(inner);
    expect(await port.findByHash("bad")).toBeNull();
    expect(await port.findByHash("bad")).toBeNull();
    expect(inner.calls).toBe(1);
  });

  it("re-queries after TTL expiry", async () => {
    vi.useFakeTimers();
    try {
      const inner = fakePort(RECORD);
      const port = new CachedApiKeyPort(inner);
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
      const port = new CachedApiKeyPort(inner);
      await port.findByHash("bad");
      vi.advanceTimersByTime(11_000); // > negative TTL (10s)
      await port.findByHash("bad");
      expect(inner.calls).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
