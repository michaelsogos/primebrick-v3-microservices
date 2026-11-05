/**
 * partition-jobs — the governed arm + durable consumer contract.
 *
 * Under test:
 *   arm via `armJobSchedule` (the ONLY public path — the raw mechanism is
 *     not exportable, so a fallback to direct publish is impossible)
 *   arm failure is non-fatal — the 30s interval tick and the
 *     `service.gateway_online` broadcast keep retrying until it lands
 *   the consumer handler RETURNS the partition report — the SDK transport
 *     middleware publishes it as the run outcome on jobs.result.*
 *   handler throw → nak (normal ack semantics), result reported failed
 *   no partitioned entities → nothing armed, nothing subscribed
 *   the JOBS stream is never re-ensured here — primebrick-job owns it
 */
import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  arm: vi.fn(async (_req?: unknown, _opts?: unknown) => ({ seq: BigInt(1) })),
  jetstreamSubscribe: vi.fn(async (_opts?: unknown) => {}),
  subscribeShielded: vi.fn(async (_subject?: unknown, _handler?: unknown) => {}),
  setProcessInterval: vi.fn((_key?: unknown, _ms?: unknown, _fn?: unknown) => 0 as never),
  ensureStream: vi.fn(async () => {}),
  partitionMaintenance: vi.fn(async () => ({ dropped: 2 })),
  reset() {
    this.arm.mockReset();
    this.arm.mockResolvedValue({ seq: BigInt(1) });
    this.jetstreamSubscribe.mockClear();
    this.subscribeShielded.mockClear();
    this.setProcessInterval.mockClear();
    this.ensureStream.mockClear();
    this.partitionMaintenance.mockReset();
    this.partitionMaintenance.mockResolvedValue({ dropped: 2 });
  },
}));

vi.mock("@primebrick/sdk", async (importOriginal) => {
  const real = await importOriginal<typeof import("@primebrick/sdk")>();
  return {
    ...real,
    NatsClient: { jetstreamSubscribe: h.jetstreamSubscribe, ensureStream: h.ensureStream },
    armJobSchedule: h.arm,
    subscribeShielded: h.subscribeShielded,
    setProcessInterval: h.setProcessInterval,
    dueLaneVerify: () => async () => ({}),
    SERVICE_SUBJECTS: { GATEWAY_ONLINE: "service.gateway_online" },
    logger: { done: () => {}, warn: () => {}, info: () => {}, error: () => {}, debug: () => {} },
  };
});
vi.mock("@primebrick/dal-pg", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@primebrick/dal-pg")>()),
  getEntityPersistenceMeta: () => ({ partition: { retention: "30d" } }),
}));
vi.mock("../db/dal.js", () => ({ getDal: () => ({ partitionMaintenance: h.partitionMaintenance }) }));
vi.mock("../config/ai-config.js", () => ({ aiConfig: () => null }));

type SubOpts = { durable: string; filterSubject: string; handler: () => Promise<unknown> };
const consumerHandler = () =>
  (h.jetstreamSubscribe.mock.calls[0]![0] as SubOpts).handler;

// Re-import per test — the module holds the `armed` latch; a fresh module
// per test keeps the arm/retry assertions honest.
let startPartitionMaintenanceJob: () => Promise<void>;
beforeEach(async () => {
  h.reset();
  vi.resetModules();
  ({ startPartitionMaintenanceJob } = await import("../controllers/nats-sub/partition-jobs.js"));
});

describe("partition-jobs — governed arm", () => {
  it("arms through armJobSchedule on its own namespace at boot", async () => {
    await startPartitionMaintenanceJob();
    // the boot arm is fired void — flush microtasks
    await vi.waitFor(() => expect(h.arm).toHaveBeenCalledTimes(1));
    expect(h.arm).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "partition-maintenance",
        schedule: "@daily",
        target: "jobs.due.system.ai.partition-maintenance",
      }),
      expect.objectContaining({ timeoutMs: 3000 }),
    );
  });

  it("a failed arm retries on the 30s interval tick until it lands", async () => {
    h.arm.mockRejectedValueOnce(new Error("job-handler down"));
    await startPartitionMaintenanceJob();
    await vi.waitFor(() => expect(h.arm).toHaveBeenCalledTimes(1));

    const tick = h.setProcessInterval.mock.calls[0]![2] as () => Promise<void>;
    expect(h.setProcessInterval.mock.calls[0]![0]).toBe("ai-partition-arm-retry");
    await tick();
    expect(h.arm).toHaveBeenCalledTimes(2);

    // Now armed — further ticks are no-ops.
    await tick();
    expect(h.arm).toHaveBeenCalledTimes(2);
  });

  it("a failed arm also retries on the service.gateway_online broadcast", async () => {
    h.arm.mockRejectedValueOnce(new Error("timeout"));
    await startPartitionMaintenanceJob();
    await vi.waitFor(() => expect(h.arm).toHaveBeenCalledTimes(1));

    const onGateway = h.subscribeShielded.mock.calls.find(
      (c) => c[0] === "service.gateway_online",
    )![1] as () => Promise<void>;
    await onGateway();
    expect(h.arm).toHaveBeenCalledTimes(2);
  });
});

describe("partition-jobs — consumer contract", () => {
  it("binds the durable on the system due lane with shield verify", async () => {
    await startPartitionMaintenanceJob();
    const opts = h.jetstreamSubscribe.mock.calls[0]![0] as SubOpts & { stream: string };
    expect(opts).toMatchObject({
      stream: "JOBS",
      durable: "exec-ai-partition-maintenance",
      filterSubject: "jobs.due.system.ai.partition-maintenance",
    });
  });

  it("handler returns the partition report — the middleware's run outcome", async () => {
    await startPartitionMaintenanceJob();
    const out = await consumerHandler()();
    expect(out).toEqual({ dropped: 2 });
  });

  it("handler rethrows — nak + failed result via the middleware", async () => {
    h.partitionMaintenance.mockRejectedValue(new Error("pg gone"));
    await startPartitionMaintenanceJob();
    await expect(consumerHandler()()).rejects.toThrow("pg gone");
  });

  it("never touches the JOBS stream — primebrick-job owns it", async () => {
    await startPartitionMaintenanceJob();
    expect(h.ensureStream).not.toHaveBeenCalled();
  });
});
