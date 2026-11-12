/**
 * run-recorder — the `jobs.result.>` governance tap + dispatched sweeper.
 *
 * The wire reality being locked down: extJsonParse decodes EVERY JSON
 * integer as `bigint` — `duration_ms`/`fire_seq` arrive as bigint, never
 * number (verified live: `Math.round(bigint)` threw "Conversion from
 * 'BigInt' to 'number' is not allowed" and every result nak-looped with
 * zero run rows written). Status vocabulary is `succeeded`/`failed` —
 * the same words `job_runs.status` and the admin stats use, verbatim.
 */
import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  handler: null as null | ((data: unknown, meta: unknown) => Promise<void>),
  findAll: vi.fn(async (_entity?: unknown, _u?: unknown, _o?: unknown) => [] as unknown[]),
  add: vi.fn(async (_entity?: unknown, _row?: unknown, _o?: unknown) => ({ uuid: "run-1" })),
  update: vi.fn(async (_entity?: unknown, _row?: unknown, _o?: unknown) => ({})),
  jetstreamSubscribe: vi.fn(),
  setProcessInterval: vi.fn(),
}));

vi.mock("@primebrick/sdk", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@primebrick/sdk")>()),
  logger: { done: () => {}, warn: () => {}, info: () => {}, error: () => {}, debug: () => {} },
  NatsClient: { jetstreamSubscribe: h.jetstreamSubscribe },
  dueLaneVerify: () => async () => undefined,
  setProcessInterval: h.setProcessInterval,
}));
vi.mock("../db/dal.js", () => ({
  getDal: () => ({ findAll: h.findAll, add: h.add, update: h.update }),
}));

const svc = await import("../services/run-recorder.js");

beforeEach(() => {
  h.handler = null;
  h.findAll.mockReset().mockResolvedValue([]);
  h.add.mockReset().mockResolvedValue({ uuid: "run-1" });
  h.update.mockReset().mockResolvedValue({});
  h.jetstreamSubscribe.mockReset().mockImplementation(async (opts: { handler: unknown }) => {
    h.handler = opts.handler as typeof h.handler;
  });
});

async function start() {
  await svc.startRunRecorder();
  if (!h.handler) throw new Error("handler not captured");
  return h.handler;
}

const meta = { subject: "jobs.result.ai.partition-maintenance", info: { redeliveryCount: 0 } };

describe("run-recorder — own-lane direct runs (schedule_subject only)", () => {
  it("records a bigint-typed executed result — the REAL wire shape", async () => {
    const handler = await start();
    await handler(
      {
        status: "succeeded",
        schedule_subject: "jobs.schedule.ai.partition-maintenance",
        target: "jobs.due.system.ai.partition-maintenance",
        fire_seq: 881n, // bigint — what extJsonParse actually delivers
        duration_ms: 43n, // bigint — Math.round() on this throws in Bun
        report: { maintenance_ran: true },
      },
      meta,
    );
    const row = h.add.mock.calls[0]![1] as Record<string, unknown>;
    expect(row).toMatchObject({
      schedule_subject: "jobs.schedule.ai.partition-maintenance",
      service_code: "ai",
      job_name: "partition-maintenance",
      lane: "system",
      status: "succeeded",
      duration_ms: 43n,
      fire_seq: 881n,
      initiator: "ai",
    });
    expect(row.report).toEqual({ maintenance_ran: true });
  });

  it("a failed result lands error fields verbatim", async () => {
    const handler = await start();
    await handler(
      {
        status: "failed",
        schedule_subject: "jobs.schedule.ai.partition-maintenance",
        target: "jobs.due.system.ai.partition-maintenance",
        error_code: "HANDLER_ERROR",
        error_detail: "pg down",
        duration_ms: 12n,
      },
      meta,
    );
    const row = h.add.mock.calls[0]![1] as Record<string, unknown>;
    expect(row.status).toBe("failed");
    expect(row.error_code).toBe("HANDLER_ERROR");
    expect(row.error_detail).toBe("pg down");
  });

  it("trampoline results (job.forward.*) are skipped — forwarder owns that row", async () => {
    const handler = await start();
    await handler(
      {
        status: "succeeded",
        target: "jobs.due.system.job.forward.abc-123",
        schedule_subject: "jobs.schedule.job.abc-123",
      },
      meta,
    );
    expect(h.add).not.toHaveBeenCalled();
    expect(h.update).not.toHaveBeenCalled();
  });
});

describe("run-recorder — forwarder-correlated runs (run_id)", () => {
  it("updates the dispatched row — bigint duration_ms from the wire", async () => {
    h.findAll.mockResolvedValue([{ uuid: "run-9", version: 2 }]);
    const handler = await start();
    await handler(
      {
        status: "succeeded",
        run_id: "run-9",
        duration_ms: 120n,
        fire_seq: 900n,
        report: { sent: 1 },
      },
      meta,
    );
    const row = h.update.mock.calls[0]![1] as Record<string, unknown>;
    expect(row).toMatchObject({
      uuid: "run-9",
      status: "succeeded",
      duration_ms: 120n,
      fire_seq: 900n,
      version: 2,
    });
    expect(h.add).not.toHaveBeenCalled();
  });

  it("an unknown run_id falls back to a direct row (observability over purity)", async () => {
    h.findAll.mockResolvedValue([]);
    const handler = await start();
    await handler(
      { status: "succeeded", run_id: "ghost", target: "emailsender.send" },
      meta,
    );
    expect(h.add).toHaveBeenCalledOnce();
  });

  it("a result with neither run_id nor schedule_subject is dropped with a warn", async () => {
    const handler = await start();
    await handler({ status: "succeeded", target: "emailsender.send" }, meta);
    expect(h.add).not.toHaveBeenCalled();
    expect(h.update).not.toHaveBeenCalled();
  });
});

describe("run-recorder — dispatched sweeper", () => {
  it("flips stale dispatched rows to lost with DISPATCH_TIMEOUT", async () => {
    h.findAll.mockResolvedValue([{ uuid: "old-run", job_name: "x.y", version: 1 }]);
    await svc.startRunRecorder();
    // The sweeper is registered via setProcessInterval — invoke it directly.
    const sweep = h.setProcessInterval.mock.calls[0]![2] as () => Promise<void>;
    await sweep();
    const row = h.update.mock.calls[0]![1] as Record<string, unknown>;
    expect(row).toMatchObject({ uuid: "old-run", status: "lost", error_code: "DISPATCH_TIMEOUT" });
  });
});
