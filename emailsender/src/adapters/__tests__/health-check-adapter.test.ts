import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock NatsClient
vi.mock("@primebrick/sdk", () => ({
  NatsClient: {
    isConnected: vi.fn(() => true),
  },
}));

import { HealthCheckAdapter } from "../health-check-adapter.js";

// We need to mock the Pool constructor — HealthCheckAdapter only uses pool.query
function makePoolMock(throwOnQuery = false) {
  return {
    query: vi.fn(async () => {
      if (throwOnQuery) throw new Error("DB connection refused");
      return { rows: [{ ok: 1 }] };
    }),
  } as any;
}

describe("HealthCheckAdapter", () => {
  let adapter: HealthCheckAdapter;

  beforeEach(() => {
    adapter = new HealthCheckAdapter(makePoolMock());
  });

  it("ping() returns true when DB query succeeds", async () => {
    const result = await adapter.ping();
    expect(result).toBe(true);
  });

  it("ping() returns false when DB query throws", async () => {
    const badAdapter = new HealthCheckAdapter(makePoolMock(true));
    const result = await badAdapter.ping();
    expect(result).toBe(false);
  });

  it("checkNats() returns ok=true when NatsClient.isConnected() is true", async () => {
    const result = await adapter.checkNats();
    expect(result.ok).toBe(true);
  });

  it("checkNats() returns ok=false when NatsClient.isConnected() is false", async () => {
    const { NatsClient } = await import("@primebrick/sdk");
    (NatsClient.isConnected as any).mockReturnValue(false);
    const result = await adapter.checkNats();
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });
});
