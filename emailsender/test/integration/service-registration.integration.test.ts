/**
 * Layer 2 integration test — ServiceRegistrar via NATS.
 *
 * The ServiceRegistrar now publishes lifecycle events via NATS instead of
 * writing to the DB directly. This test verifies that the registrar
 * publishes the correct subjects and payloads.
 *
 * Cases:
 *  1. register() publishes to service.register with correct payload
 *  2. sendHeartbeat() publishes to service.heartbeat with correct payload
 *  3. unregister() publishes to service.unregister with correct payload
 *  4. healthCheckFn is called and its result is included in the payload
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServiceRegistrar, SERVICE_SUBJECTS } from "@primebrick/sdk";

function makeNatsMock() {
  const calls: Array<{ subject: string; payload: unknown }> = [];
  return {
    publish: vi.fn(async (subject: string, data: unknown) => {
      calls.push({ subject, payload: data });
    }),
    isConnected: vi.fn(() => true),
    calls,
  };
}

const baseConfig = {
  serviceCode: "EMAILSENDER",
  baseUrl: "http://localhost:3003",
  endpoints: { webhook: "http://localhost:3003/webhook", health: "http://localhost:3003/health" },
  service_version: "1.0.0",
  name: "Email Sender",
  description: "Email sending microservice",
  is_behind_scaler: false,
};

describe("ServiceRegistrar — NATS registration", () => {
  let nats: ReturnType<typeof makeNatsMock>;

  beforeEach(() => {
    nats = makeNatsMock();
  });

  it("register() publishes to service.register with correct payload", async () => {
    const registrar = new ServiceRegistrar(nats as any, baseConfig);
    await registrar.register();
    expect(nats.publish).toHaveBeenCalledTimes(1);
    const call = nats.calls[0];
    expect(call.subject).toBe(SERVICE_SUBJECTS.REGISTER);
    expect(call.payload.code).toBe("EMAILSENDER");
    expect(call.payload.base_url).toBe("http://localhost:3003");
    expect(call.payload.endpoints).toEqual(baseConfig.endpoints);
    expect(call.payload.service_version).toBe("1.0.0");
    expect(call.payload.name).toBe("Email Sender");
    expect(call.payload.is_behind_scaler).toBe(false);
    expect(call.payload.http_healthy).toBe(true);
    expect(call.payload.nats_connected).toBe(true);
  });

  it("sendHeartbeat() publishes to service.heartbeat with correct payload", async () => {
    const registrar = new ServiceRegistrar(nats as any, baseConfig);
    await registrar.sendHeartbeat();
    expect(nats.publish).toHaveBeenCalledTimes(1);
    const call = nats.calls[0];
    expect(call.subject).toBe(SERVICE_SUBJECTS.HEARTBEAT);
    expect(call.payload.code).toBe("EMAILSENDER");
    expect(call.payload.service_version).toBe("1.0.0");
    // heartbeat does NOT include endpoints
    expect(call.payload.endpoints).toBeUndefined();
  });

  it("unregister() publishes to service.unregister with correct payload", async () => {
    const registrar = new ServiceRegistrar(nats as any, baseConfig);
    await registrar.unregister();
    expect(nats.publish).toHaveBeenCalledTimes(1);
    const call = nats.calls[0];
    expect(call.subject).toBe(SERVICE_SUBJECTS.UNREGISTER);
    expect(call.payload.code).toBe("EMAILSENDER");
    expect(call.payload.base_url).toBe("http://localhost:3003");
    expect(call.payload.is_behind_scaler).toBe(false);
  });

  it("healthCheckFn is called and its result is included in the payload", async () => {
    const healthCheckFn = vi.fn(async () => ({
      http_healthy: false,
      checks: { db: { ok: false, error: "connection refused" } },
    }));
    const registrar = new ServiceRegistrar(nats as any, baseConfig, healthCheckFn);
    await registrar.sendHeartbeat();
    const call = nats.calls[0];
    expect(call.payload.http_healthy).toBe(false);
    expect(call.payload.checks.db.ok).toBe(false);
    expect(call.payload.checks.db.error).toBe("connection refused");
    expect(healthCheckFn).toHaveBeenCalledTimes(1);
  });

  it("nats_connected reflects NatsClient.isConnected() result", async () => {
    nats.isConnected = vi.fn(() => false);
    const registrar = new ServiceRegistrar(nats as any, baseConfig);
    await registrar.sendHeartbeat();
    const call = nats.calls[0];
    expect(call.payload.nats_connected).toBe(false);
  });
});
