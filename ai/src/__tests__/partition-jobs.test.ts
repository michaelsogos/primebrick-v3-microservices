/**
 * partition-jobs — the system-trigger declaration + callable contract.
 *
 * Under test:
 *   materialize via `declareSystemJobs` (the ONLY public path onto
 *     `jobs.ctl.triggers.materialize`) — code-owned contract declared in
 *     code, schedule seeded then user-governed
 *   a failed materialize is non-fatal — the 30s interval tick and the
 *     `service.gateway_online` broadcast keep retrying until it lands
 *   the callable is bound through `makeNatsRoutes` on the module's own
 *     subject with a payload contract — an undeclared callable is
 *     unscheduleable (JH's trigger target check would refuse it)
 *   the callable handler RETURNS the partition report — the SDK route
 *     middleware publishes it as the run outcome on jobs.result.*
 *   handler throw → failed result via the middleware
 *   no partitioned entities → nothing declared, nothing subscribed
 */
import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  declareJobs: vi.fn(async (_jobs?: unknown, _opts?: unknown) => [
    { key: "ai.partition_maintenance", action: "inserted", uuid: "u-1" },
  ]),
  makeNatsRoutes: vi.fn(async (_routes?: unknown, _deps?: unknown) => []),
  subscribeShielded: vi.fn(async (_subject?: unknown, _handler?: unknown) => {}),
  setProcessInterval: vi.fn((_key?: unknown, _ms?: unknown, _fn?: unknown) => 0 as never),
  partitionMaintenance: vi.fn(async () => ({ dropped: 2 })),
  reset() {
    this.declareJobs.mockReset();
    this.declareJobs.mockResolvedValue([
      { key: "ai.partition_maintenance", action: "inserted", uuid: "u-1" },
    ]);
    this.makeNatsRoutes.mockClear();
    this.subscribeShielded.mockClear();
    this.setProcessInterval.mockClear();
    this.partitionMaintenance.mockReset();
    this.partitionMaintenance.mockResolvedValue({ dropped: 2 });
  },
}));

vi.mock("@primebrick/sdk", async (importOriginal) => {
  const real = await importOriginal<typeof import("@primebrick/sdk")>();
  return {
    ...real,
    declareSystemJobs: h.declareJobs,
    makeNatsRoutes: h.makeNatsRoutes,
    subscribeShielded: h.subscribeShielded,
    setProcessInterval: h.setProcessInterval,
    SERVICE_SUBJECTS: { GATEWAY_ONLINE: "service.gateway_online" },
    logger: { done: () => {}, warn: () => {}, info: () => {}, error: () => {}, debug: () => {} },
  };
});
vi.mock("@primebrick/dal-pg", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@primebrick/dal-pg")>()),
  getEntityPersistenceMeta: () => ({ partition: { retention: "30d" } }),
}));
vi.mock("../db/dal.js", () => ({ getDal: () => ({ partitionMaintenance: h.partitionMaintenance }) }));

type Route = { subject: string; queue?: string; permissions: readonly string[]; handler: (ctx: unknown) => Promise<unknown> };
const callableRoute = () => (h.makeNatsRoutes.mock.calls[0]![0] as Route[])[0]!;

// Re-import per test — the module holds the `armed` latch; a fresh module
// per test keeps the declare/retry assertions honest.
let startPartitionMaintenanceJob: () => Promise<void>;
beforeEach(async () => {
  h.reset();
  vi.resetModules();
  ({ startPartitionMaintenanceJob } = await import("../controllers/nats-sub/partition-jobs.js"));
});

describe("partition-jobs — governed materialize", () => {
  it("declares the system job on the module's own namespace at boot", async () => {
    await startPartitionMaintenanceJob();
    await vi.waitFor(() => expect(h.declareJobs).toHaveBeenCalledTimes(1));
    expect(h.declareJobs).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          key: "partition_maintenance",
          schedule_spec: "0 3 * * *",
          target_subject: "ai.partition_maintenance",
          run_as: "system",
        }),
      ],
      expect.objectContaining({ timeoutMs: 3000 }),
    );
  });

  it("a failed materialize retries on the 30s interval tick until it lands", async () => {
    h.declareJobs.mockRejectedValueOnce(new Error("job-handler down"));
    await startPartitionMaintenanceJob();
    await vi.waitFor(() => expect(h.declareJobs).toHaveBeenCalledTimes(1));

    const tick = h.setProcessInterval.mock.calls[0]![2] as () => Promise<void>;
    expect(h.setProcessInterval.mock.calls[0]![0]).toBe("ai-partition-materialize-retry");
    await tick();
    expect(h.declareJobs).toHaveBeenCalledTimes(2);

    // Now materialized — further ticks are no-ops.
    await tick();
    expect(h.declareJobs).toHaveBeenCalledTimes(2);
  });

  it("a failed materialize also retries on the service.gateway_online broadcast", async () => {
    h.declareJobs.mockRejectedValueOnce(new Error("timeout"));
    await startPartitionMaintenanceJob();
    await vi.waitFor(() => expect(h.declareJobs).toHaveBeenCalledTimes(1));

    const onGateway = h.subscribeShielded.mock.calls.find(
      (c) => c[0] === "service.gateway_online",
    )![1] as () => Promise<void>;
    await onGateway();
    expect(h.declareJobs).toHaveBeenCalledTimes(2);
  });
});

describe("partition-jobs — callable contract", () => {
  it("binds the callable as a queued route on the module's own subject", async () => {
    await startPartitionMaintenanceJob();
    const route = callableRoute();
    expect(route.subject).toBe("ai.partition_maintenance");
    expect(route.queue).toBe("ai");
    // System-lane: no user context — permissions empty, the L1 client
    // shield is the only gate.
    expect(route.permissions).toEqual([]);
  });

  it("handler returns the partition report — the middleware's run outcome", async () => {
    await startPartitionMaintenanceJob();
    const out = await callableRoute().handler({});
    expect(out).toEqual({ dropped: 2 });
  });

  it("handler rethrows — failed result via the middleware", async () => {
    h.partitionMaintenance.mockRejectedValue(new Error("pg gone"));
    await startPartitionMaintenanceJob();
    await expect(callableRoute().handler({})).rejects.toThrow("pg gone");
  });
});
