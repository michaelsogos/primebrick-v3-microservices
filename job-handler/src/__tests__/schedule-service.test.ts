/**
 * schedule-service — the atomic arm/disarm protocol, sole writer of
 * `jobs.schedule.*` declarations and their `job_schedules` mirror.
 *
 * Under test:
 *   arm    → ensure(PubAck) → read-back verify → mirror upsert;
 *            mirror failure COMPENSATES with a purge
 *   disarm → cancel(PubAck) → read-back absent verify → mirror flip;
 *            a surviving declaration NEVER flips the row
 *   drift  → stale (terminal row + live decl) / missing (armed + no decl)
 *            / expected absence (past @at, expired TTL) is NOT drift
 *   fired  → only `once`+`armed` rows flip to fired
 */
import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  ensure: vi.fn(async (_opts?: unknown) => BigInt(7)),
  cancel: vi.fn(async (_subject?: unknown, _cancel?: unknown) => BigInt(8)),
  get: vi.fn(async (_subject?: unknown) => null as unknown),
  list: vi.fn(async () => [] as string[]),
  findAll: vi.fn(async () => [] as unknown[]),
  add: vi.fn(async (_entity?: unknown, _row?: unknown) => ({ uuid: "sched-row-1" })),
  update: vi.fn(async () => ({})),
  reset() {
    // mockReset (not mockClear) — a sticky rejected impl must not leak
    // into the next test.
    this.ensure.mockReset();
    this.ensure.mockResolvedValue(BigInt(7));
    this.cancel.mockReset();
    this.cancel.mockResolvedValue(BigInt(8));
    this.get.mockReset();
    this.get.mockResolvedValue(null);
    this.list.mockReset();
    this.list.mockResolvedValue([]);
    this.findAll.mockReset();
    this.findAll.mockResolvedValue([]);
    this.add.mockReset();
    this.add.mockResolvedValue({ uuid: "sched-row-1" });
    this.update.mockReset();
    this.update.mockResolvedValue({});
  },
}));

vi.mock("../nats/schedule-mechanism.js", () => ({
  ensureJobSchedule: h.ensure,
  cancelJobSchedule: h.cancel,
  getJobSchedule: h.get,
  listJobScheduleSubjects: h.list,
}));
vi.mock("@primebrick/sdk", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@primebrick/sdk")>()),
  logger: { done: () => {}, warn: () => {}, info: () => {}, error: () => {}, debug: () => {} },
}));
vi.mock("../db/dal.js", () => ({
  getDal: () => ({ findAll: h.findAll, add: h.add, update: h.update, delete: vi.fn(async () => ({})) }),
}));

const svc = await import("../services/schedule-service.js");

const decl = (over: Record<string, unknown> = {}) => ({
  subject: "jobs.schedule.ai.partition-maintenance",
  schedule: "@every 6h",
  target: "jobs.due.system.ai.partition-maintenance",
  seq: 7,
  ...over,
});

const armInput = (over: Record<string, unknown> = {}) => ({
  schedule_subject: "jobs.schedule.ai.partition-maintenance",
  schedule: "@every 6h",
  target: "jobs.due.system.ai.partition-maintenance",
  kind: "infra_derived" as const,
  caller_service: "ai",
  ...over,
});

const mirrorRow = (over: Record<string, unknown> = {}) => ({
  uuid: "row-1",
  schedule_subject: "jobs.schedule.job.trig-1",
  service_code: "job",
  job_name: "trig",
  kind: "trigger",
  lane: "user",
  schedule_spec: "@every 1d",
  schedule_type: "recurring",
  target_subject: "emailsender.send",
  status: "armed",
  version: 3,
  ...over,
});

beforeEach(() => h.reset());

describe("declareSchedule — arm protocol", () => {
  it("ensure → read-back verify → mirror insert, in order", async () => {
    const order: string[] = [];
    h.ensure.mockImplementation(async () => (order.push("ensure"), BigInt(7)));
    h.get.mockImplementation(async () => (order.push("verify"), decl()));
    h.add.mockImplementation(async () => (order.push("mirror"), { uuid: "sched-row-1" }));

    await svc.declareSchedule(armInput());

    expect(order).toEqual(["ensure", "verify", "mirror"]);
    expect(h.add).toHaveBeenCalledOnce();
    const row = h.add.mock.calls[0]![1] as unknown as Record<string, unknown>;
    expect(row).toMatchObject({
      schedule_subject: "jobs.schedule.ai.partition-maintenance",
      status: "armed",
      schedule_type: "recurring",
      service_code: "ai",
    });
  });

  it("a declaration that stores but loses its schedule headers → ARM_VERIFY_FAILED", async () => {
    h.get.mockResolvedValue(decl({ schedule: undefined })); // stored, not schedulable

    await expect(svc.declareSchedule(armInput())).rejects.toMatchObject({ internal_code: "ARM_VERIFY_FAILED" });
    expect(h.add).not.toHaveBeenCalled();
  });

  it("mirror failure COMPENSATES — the declaration is purged, never left live", async () => {
    h.get.mockResolvedValue(decl());
    h.add.mockRejectedValue(new Error("pg down"));

    await expect(svc.declareSchedule(armInput())).rejects.toMatchObject({ internal_code: "MIRROR_WRITE_FAILED" });
    expect(h.cancel).toHaveBeenCalledWith(
      "jobs.schedule.ai.partition-maintenance",
      "jobs.cancel.ai.partition-maintenance",
    );
  });

  it("a service cannot declare in a foreign namespace", async () => {
    await expect(svc.declareSchedule(armInput({ caller_service: "emailsender" }))).rejects.toMatchObject({ internal_code: "FOREIGN_NAMESPACE" });
    expect(h.ensure).not.toHaveBeenCalled();
  });

  it("the fired target must execute back on the declaring service", async () => {
    await expect(
      svc.declareSchedule(armInput({ target: "jobs.due.system.emailsender.send" })),
    ).rejects.toMatchObject({ internal_code: "NAMESPACE_MISMATCH" });
    expect(h.ensure).not.toHaveBeenCalled();
  });

  it("ttl lands on the row as expires_at = armed_at + ttl", async () => {
    h.get.mockResolvedValue(decl());
    await svc.declareSchedule(armInput({ ttl: "1h" }));
    const row = h.add.mock.calls[0]![1] as unknown as Record<string, unknown>;
    expect((row.expires_at as Date).getTime()).toBeGreaterThan(Date.now() + 3_500_000);
  });

  it("a fired once row + same spec → skipped, NOTHING re-declared (a past @at fires immediately)", async () => {
    const spec = "@at 2026-01-01T00:00:00Z";
    h.findAll.mockResolvedValue([
      mirrorRow({ status: "fired", schedule_type: "once", schedule_spec: spec }),
    ]);

    const r = await svc.declareSchedule(armInput({ schedule: spec }));

    expect(r).toEqual({ skipped: "terminal-once" });
    expect(h.ensure).not.toHaveBeenCalled();
    expect(h.add).not.toHaveBeenCalled();
    expect(h.update).not.toHaveBeenCalled();
  });

  it("an expired once row + same spec → skipped", async () => {
    const spec = "@at 2026-01-01T00:00:00Z";
    h.findAll.mockResolvedValue([
      mirrorRow({ status: "expired", schedule_type: "once", schedule_spec: spec }),
    ]);

    const r = await svc.declareSchedule(armInput({ schedule: spec }));
    expect(r).toEqual({ skipped: "terminal-once" });
    expect(h.ensure).not.toHaveBeenCalled();
  });

  it("a fired once row + CHANGED spec → new lifecycle, arms normally", async () => {
    h.findAll.mockResolvedValue([
      mirrorRow({ status: "fired", schedule_type: "once", schedule_spec: "@at 2026-01-01T00:00:00Z" }),
    ]);
    h.get.mockResolvedValue(decl({ schedule: "@every 6h" }));

    const r = await svc.declareSchedule(armInput());

    expect(r.skipped).toBeUndefined();
    expect(h.ensure).toHaveBeenCalledOnce();
    // mirror row resets to armed — a new lifecycle, not a re-fire.
    expect(h.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "armed", fired_at: undefined }),
      expect.anything(),
    );
  });
});

describe("disarmSchedule — disarm protocol", () => {
  it("cancel → absent verify → row flips disarmed", async () => {
    const row = mirrorRow({ status: "armed" });
    h.findAll.mockResolvedValue([row]);
    h.get.mockResolvedValue(null); // declaration gone

    await svc.disarmSchedule("jobs.schedule.job.trig-1", "system:test");

    expect(h.cancel).toHaveBeenCalledWith("jobs.schedule.job.trig-1", "jobs.cancel.job.trig-1");
    expect(h.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ uuid: "row-1", status: "disarmed" }),
      expect.anything(),
    );
  });

  it("a declaration surviving its purge PubAck NEVER flips the row", async () => {
    const row = mirrorRow({ status: "armed" });
    h.findAll.mockResolvedValue([row]);
    h.get.mockResolvedValue(decl({ subject: "jobs.schedule.job.trig-1" })); // still live!

    await expect(svc.disarmSchedule("jobs.schedule.job.trig-1", "system:test")).rejects.toMatchObject(
      { internal_code: "DISARM_VERIFY_FAILED" },
    );
    expect(h.update).not.toHaveBeenCalled();
  });
});

describe("markScheduleFired — one-shot lifecycle", () => {
  it("flips only once+armed rows", async () => {
    h.findAll.mockResolvedValue([mirrorRow({ schedule_type: "once", schedule_spec: "@at 2030-01-01T00:00:00Z" })]);
    await svc.markScheduleFired("jobs.schedule.job.trig-1");
    expect(h.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "fired" }),
      expect.anything(),
    );
  });

  it("a recurring schedule never flips — its declaration lives on", async () => {
    h.findAll.mockResolvedValue([]); // the status/type filter found nothing
    await svc.markScheduleFired("jobs.schedule.job.trig-1");
    expect(h.update).not.toHaveBeenCalled();
  });
});

describe("scheduleDrift — mirror vs live truth", () => {
  const row = mirrorRow();

  it("terminal row + live declaration → stale (NATS still fires!)", () => {
    const d = svc.scheduleDrift({ ...row, status: "disarmed" }, true);
    expect(d).toEqual({ live: true, drift: "stale" });
  });

  it("armed row + missing declaration → missing", () => {
    const d = svc.scheduleDrift({ ...row, status: "armed" }, false);
    expect(d).toEqual({ live: false, drift: "missing" });
  });

  it("armed row + live declaration → no drift", () => {
    const d = svc.scheduleDrift({ ...row, status: "armed" }, true);
    expect(d).toEqual({ live: true, drift: null });
  });

  it("once + past @at + no declaration → expected absence, NOT drift", () => {
    const d = svc.scheduleDrift(
      { ...row, status: "armed", schedule_type: "once", schedule_spec: "@at 2020-01-01T00:00:00Z" },
      false,
    );
    expect(d.drift).toBeNull();
  });

  it("recurring + expired ttl + no declaration → expected absence, NOT drift", () => {
    const d = svc.scheduleDrift(
      { ...row, status: "armed", expires_at: new Date(Date.now() - 1000) },
      false,
    );
    expect(d.drift).toBeNull();
  });

  it("enumeration failure → drift unknown, never guessed", () => {
    const d = svc.scheduleDrift(row, undefined);
    expect(d).toEqual({ live: undefined, drift: null });
  });
});

describe("reconcileSchedules — strict enforcement", () => {
  it("terminal row + live declaration → purged (NATS loses)", async () => {
    h.findAll.mockResolvedValue([mirrorRow({ status: "disarmed" })]);
    h.get.mockResolvedValue(decl({ subject: "jobs.schedule.job.trig-1" }));

    const report = await svc.reconcileSchedules();

    expect(h.cancel).toHaveBeenCalledWith("jobs.schedule.job.trig-1", "jobs.cancel.job.trig-1");
    expect(report.purged_stale).toEqual(["jobs.schedule.job.trig-1"]);
  });

  it("live declaration + no row → orphan, PURGED strict (JH is the only writer)", async () => {
    h.findAll.mockResolvedValue([]);
    h.list.mockResolvedValue(["jobs.schedule.rogue.job"]);

    const report = await svc.reconcileSchedules();

    expect(h.cancel).toHaveBeenCalledWith("jobs.schedule.rogue.job", "jobs.cancel.rogue.job");
    expect(report.purged_orphan).toEqual(["jobs.schedule.rogue.job"]);
  });

  it("armed row + missing declaration → reported, not silently healed", async () => {
    h.findAll.mockResolvedValue([mirrorRow({ status: "armed" })]);
    h.get.mockResolvedValue(null);

    const report = await svc.reconcileSchedules();

    expect(report.armed_missing).toEqual(["jobs.schedule.job.trig-1"]);
  });

  it("kind=trigger armed-missing + rescueTrigger → re-derived via the engine, not surfaced", async () => {
    h.findAll.mockResolvedValue([
      mirrorRow({ status: "armed", trigger_uuid: "trig-uuid-9" }),
    ]);
    h.get.mockResolvedValue(null);
    const rescue = vi.fn(async () => {});

    const report = await svc.reconcileSchedules({ rescueTrigger: rescue });

    expect(rescue).toHaveBeenCalledWith("trig-uuid-9");
    expect(report.trigger_rescued).toEqual(["jobs.schedule.job.trig-1"]);
    expect(report.armed_missing).toEqual([]);
  });

  it("kind=infra_derived armed-missing → surfaced even with rescueTrigger", async () => {
    h.findAll.mockResolvedValue([
      mirrorRow({ status: "armed", kind: "infra_derived", trigger_uuid: undefined }),
    ]);
    h.get.mockResolvedValue(null);
    const rescue = vi.fn(async () => {});

    const report = await svc.reconcileSchedules({ rescueTrigger: rescue });

    expect(rescue).not.toHaveBeenCalled();
    expect(report.armed_missing).toEqual(["jobs.schedule.job.trig-1"]);
  });

  it("once + past @at + missing declaration → self-heals to fired", async () => {
    h.findAll.mockResolvedValue([
      mirrorRow({ status: "armed", schedule_type: "once", schedule_spec: "@at 2020-01-01T00:00:00Z" }),
    ]);
    h.get.mockResolvedValue(null);

    const report = await svc.reconcileSchedules();

    expect(report.self_healed).toEqual([{ subject: "jobs.schedule.job.trig-1", to: "fired" }]);
    expect(h.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "fired" }),
      expect.anything(),
    );
  });

  it("one subject's lookup failure never aborts the pass", async () => {
    h.findAll.mockResolvedValue([
      mirrorRow({ uuid: "a", schedule_subject: "jobs.schedule.job.a" }),
      mirrorRow({ uuid: "b", schedule_subject: "jobs.schedule.job.b", status: "disarmed" }),
    ]);
    h.get
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce(decl({ subject: "jobs.schedule.job.b" }));

    const report = await svc.reconcileSchedules();

    expect(report.errors).toHaveLength(1);
    expect(report.purged_stale).toEqual(["jobs.schedule.job.b"]);
  });
});
