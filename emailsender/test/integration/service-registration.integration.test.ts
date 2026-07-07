/**
 * Layer 2 integration test — ServiceRegistryAdapter (emailsender's adapter
 * for the SDK's ServiceRegistryPort).
 *
 * Tests the adapter against the real public.service_registry table via the
 * getDal() gateway. The SDK's ServiceRegistrar logic itself has its own unit
 * tests in the SDK repo — this test verifies the emailsender adapter's
 * dal.find/dal.add/dal.update calls work against real PG.
 *
 * Cases:
 *  1. findByCode returns null when no row exists
 *  2. insert adds a row, findByCode finds it
 *  3. updateByCode updates base_url + endpoints
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { ServiceRegistryAdapter } from "../../src/adapters/service-registry-adapter.js";
import {
  initTestDal,
  setupTestSchema,
  truncateTestTables,
  closeTestDal,
} from "../helpers/setup.js";

beforeAll(async () => {
  initTestDal();
  await setupTestSchema();
});

afterAll(async () => {
  await closeTestDal();
});

beforeEach(async () => {
  await truncateTestTables();
});

describe("ServiceRegistryAdapter — integration (real PG)", () => {
  it("findByCode returns null when no row exists", async () => {
    const adapter = new ServiceRegistryAdapter();
    const result = await adapter.findByCode("EMAILSENDER");
    expect(result).toBeNull();
  });

  it("insert adds a row, findByCode finds it", async () => {
    const adapter = new ServiceRegistryAdapter();
    await adapter.insert({
      code: "EMAILSENDER",
      base_url: "http://localhost:3003",
      endpoints: { webhook: "http://localhost:3003/webhook", health: "http://localhost:3003/health" },
    });

    const result = await adapter.findByCode("EMAILSENDER");
    expect(result).not.toBeNull();
    expect(result!.code).toBe("EMAILSENDER");
    expect(result!.base_url).toBe("http://localhost:3003");
    expect(result!.endpoints).toEqual({
      webhook: "http://localhost:3003/webhook",
      health: "http://localhost:3003/health",
    });
  });

  it("updateByCode updates base_url + endpoints", async () => {
    const adapter = new ServiceRegistryAdapter();
    await adapter.insert({
      code: "EMAILSENDER",
      base_url: "http://localhost:3003",
      endpoints: { webhook: "http://localhost:3003/webhook" },
    });

    await adapter.updateByCode("EMAILSENDER", {
      base_url: "http://new-host:4000",
      endpoints: { webhook: "http://new-host:4000/webhook", health: "http://new-host:4000/health" },
    });

    const result = await adapter.findByCode("EMAILSENDER");
    expect(result).not.toBeNull();
    expect(result!.base_url).toBe("http://new-host:4000");
    expect(result!.endpoints).toEqual({
      webhook: "http://new-host:4000/webhook",
      health: "http://new-host:4000/health",
    });
  });
});
