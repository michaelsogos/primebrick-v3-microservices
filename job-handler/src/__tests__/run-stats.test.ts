/**
 * `POST /actions/job-run-stats` — the response is a ZERO-FILLED bucket
 * grid over the span (position = time; the FE renders slots by index and
 * the last slot is always the current bucket). The trigger-keyed request
 * variant must resolve `jobs.schedule.job.<uuid>` subjects server-side and
 * return stats keyed by the submitted uuid (the FE sparkline binds
 * `row_key:"uuid"`).
 *
 * Every run state is counted — succeeded/failed/skipped/lost/dispatched —
 * and every bucket carries `expected`/`missed` computed in closed form
 * from the schedule's spec + arm window (`@every`/`@at` enumerable; cron
 * is not derivable → null). `missed` subtracts ARRIVALS (every status —
 * a skipped due still arrived), never zero-data buckets themselves.
 */

import { describe, expect, it, vi } from "vitest";
import { dalPgMock } from "./mock-dal.js";

const { findAll, listRowsBySubjects } = vi.hoisted(() => ({
  findAll: vi.fn(),
  listRowsBySubjects: vi.fn(async (_subjects: string[]) => [] as unknown[]),
}));

vi.mock("@primebrick/dal-pg", async (importOriginal) => dalPgMock({ findAll }, importOriginal));
vi.mock("../modules/jobs/jobs.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../modules/jobs/jobs.service.js")>()),
  JobSchedulesService: class {
    async listRowsBySubjects(subjects: string[]) {
      return listRowsBySubjects(subjects);
    }
  },
}));
vi.mock("../services/schedule-service.js", () => ({
  disarmSchedule: vi.fn(),
  dropScheduleMirror: vi.fn(),
  getLastReconcileReport: vi.fn(),
  getScheduleRow: vi.fn(),
  scheduleDrift: vi.fn(),
  unsuppressSchedule: vi.fn(),
  // Real impl — `ttlToMs` is pure string math shared with the arm path.
  ttlToMs: (ttl: string) => {
    const m = /^(\d+)(ms|s|m|h|d)$/.exec(ttl.trim());
    if (!m) return undefined;
    const unit = { ms: 1, s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2] as "ms" | "s" | "m" | "h" | "d"];
    return Number(m[1]) * unit;
  },
}));
vi.mock("../services/triggers-engine.js", () => ({ refreshTrigger: vi.fn() }));
vi.mock("../nats/schedule-mechanism.js", () => ({ listJobScheduleSubjects: vi.fn() }));

import { runStats } from "../controllers/http/actions-route.js";

import { extJsonStringify } from '@primebrick/sdk';
/** Yesterday's day-boundary — guaranteed inside the default 30d span. */
function yesterdayBucket(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}
const todayBucketIso = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

const statsRow = (subject: string, over: Partial<Record<"succeeded" | "failed" | "skipped" | "lost" | "dispatched", bigint>> = {}) => ({
  schedule_subject: subject,
  bucket_start: yesterdayBucket(),
  succeeded: 3n,
  failed: 1n,
  skipped: 0n,
  lost: 0n,
  dispatched: 0n,
  ...over,
});

interface Bucket {
  bucket_start: string;
  succeeded: number;
  failed: number;
  skipped: number;
  lost: number;
  dispatched: number;
  expected: number | null;
  missed: number | null;
}
type StatsRes = { bucket_unit: string; stats: Record<string, Bucket[]> };

const schedRow = (subject: string, over: Record<string, unknown> = {}) => ({
  schedule_subject: subject,
  schedule_spec: "@every 1d",
  armed_at: new Date(Date.now() - 15 * 86_400_000),
  disarmed_at: undefined,
  expires_at: undefined,
  ...over,
});

describe("runStats", () => {
  it("empty subjects → empty stats without querying", async () => {
    findAll.mockClear();
    listRowsBySubjects.mockClear();
    expect(await runStats({})).toEqual({ bucket_unit: "day", stats: {} });
    expect(findAll).not.toHaveBeenCalled();
    expect(listRowsBySubjects).not.toHaveBeenCalled();
  });

  it("schedule_subjects → zero-filled grid, counts land at their bucket position", async () => {
    findAll.mockClear();
    listRowsBySubjects.mockClear();
    findAll.mockResolvedValue([statsRow("jobs.schedule.heartbeat")]);
    listRowsBySubjects.mockResolvedValue([]);
    const res = (await runStats({ schedule_subjects: ["jobs.schedule.heartbeat"] })) as StatsRes;
    const series = res.stats["jobs.schedule.heartbeat"]!;
    // Complete grid over 30d → ~30-31 day buckets, rightmost = today.
    expect(series.length).toBeGreaterThanOrEqual(30);
    expect(series[series.length - 1]!.bucket_start).toBe(todayBucketIso());
    // The run bucket lands at ITS timestamp — not packed at index 0.
    const hit = series.filter((b) => b.succeeded === 3);
    expect(hit).toHaveLength(1);
    expect(hit[0]!.bucket_start).toBe(yesterdayBucket().toISOString());
    // Every other slot is an explicit zero — never-ran buckets are emitted.
    expect(series.filter((b) => b.succeeded === 0 && b.failed === 0).length).toBe(series.length - 1);
    // No mirror row → the plan is unknown, never guessed.
    expect(series.every((b) => b.expected === null && b.missed === null)).toBe(true);
  });

  it("subject with no runs → full zero grid (the never-ran story)", async () => {
    findAll.mockClear();
    findAll.mockResolvedValue([]);
    listRowsBySubjects.mockResolvedValue([]);
    const res = (await runStats({ schedule_subjects: ["jobs.schedule.never"] })) as StatsRes;
    const series = res.stats["jobs.schedule.never"]!;
    expect(series.length).toBeGreaterThanOrEqual(30);
    expect(series.every((b) => b.succeeded === 0 && b.failed === 0 && b.skipped === 0)).toBe(true);
  });

  it("trigger_uuids → resolves mirror subjects, responds keyed by uuid", async () => {
    findAll.mockClear();
    findAll.mockResolvedValue([statsRow("jobs.schedule.job.t-1")]);
    listRowsBySubjects.mockResolvedValue([]);
    const res = (await runStats({ trigger_uuids: ["t-1"] })) as StatsRes;
    const series = res.stats["t-1"]!;
    expect(series.find((b) => b.failed === 1)?.bucket_start).toBe(yesterdayBucket().toISOString());
    expect(res.stats["jobs.schedule.job.t-1"]).toBeUndefined();
    // The SQL filter must have received the resolved mirror subject.
    const filter = findAll.mock.calls[0]?.[2]?.filters?.[0];
    expect(extJsonStringify(filter)).toContain("jobs.schedule.job.t-1");
    // The mirror-row read asks for the SAME resolved subject.
    expect(listRowsBySubjects).toHaveBeenCalledWith(["jobs.schedule.job.t-1"]);
  });

  it("lost + dispatched are counted as their own series (and as arrivals)", async () => {
    findAll.mockClear();
    findAll.mockResolvedValue([statsRow("jobs.schedule.mix", { lost: 2n, dispatched: 1n })]);
    listRowsBySubjects.mockResolvedValue([]);
    const res = (await runStats({ schedule_subjects: ["jobs.schedule.mix"] })) as StatsRes;
    const hit = res.stats["jobs.schedule.mix"]!.find((b) => b.lost === 2)!;
    expect(hit.dispatched).toBe(1);
    expect(hit.succeeded).toBe(3);
  });

  it("@every → closed-form expected per bucket; missed = owed − arrived", async () => {
    findAll.mockClear();
    findAll.mockResolvedValue([]);
    const armed = new Date();
    armed.setUTCHours(0, 0, 0, 0);
    armed.setUTCDate(armed.getUTCDate() - 15);
    listRowsBySubjects.mockResolvedValue([schedRow("jobs.schedule.daily", { armed_at: armed })]);
    const res = (await runStats({ schedule_subjects: ["jobs.schedule.daily"] })) as StatsRes;
    const series = res.stats["jobs.schedule.daily"]!;
    // `@every 1d` armed at a day boundary → exactly one owed fire per
    // subsequent bucket; 15 armed days → 15 owed fires total.
    const owed = series.map((b) => b.expected ?? 0);
    expect(owed.reduce((a, b) => a + b, 0)).toBe(15);
    expect(owed.every((v) => v === 0 || v === 1)).toBe(true);
    // No runs at all → every owed fire is missed.
    const missed = series.map((b) => b.missed ?? 0);
    expect(missed.reduce((a, b) => a + b, 0)).toBe(15);
  });

  it("skipped runs count as ARRIVALS — they never show as missed", async () => {
    findAll.mockClear();
    findAll.mockResolvedValue([statsRow("jobs.schedule.daily", { succeeded: 0n, failed: 0n, skipped: 2n })]);
    const armed = new Date();
    armed.setUTCHours(0, 0, 0, 0);
    armed.setUTCDate(armed.getUTCDate() - 15);
    listRowsBySubjects.mockResolvedValue([schedRow("jobs.schedule.daily", { armed_at: armed })]);
    const res = (await runStats({ schedule_subjects: ["jobs.schedule.daily"] })) as StatsRes;
    const hit = res.stats["jobs.schedule.daily"]!.find((b) => b.skipped === 2)!;
    expect(hit.expected).toBe(1);
    expect(hit.missed).toBe(0);
  });

  it("@at → expected=1 in the fire's bucket only; future @at owes nothing", async () => {
    findAll.mockClear();
    findAll.mockResolvedValue([]);
    const armed = new Date(Date.now() - 10 * 86_400_000);
    const fire = yesterdayBucket();
    fire.setUTCHours(12, 0, 0, 0);
    listRowsBySubjects.mockResolvedValue([
      schedRow("jobs.schedule.once", { schedule_spec: `@at ${fire.toISOString()}`, armed_at: armed }),
      schedRow("jobs.schedule.future", { schedule_spec: `@at ${new Date(Date.now() + 86_400_000).toISOString()}`, armed_at: armed }),
    ]);
    const res = (await runStats({ schedule_subjects: ["jobs.schedule.once", "jobs.schedule.future"] })) as StatsRes;
    const once = res.stats["jobs.schedule.once"]!;
    const owed = once.filter((b) => b.expected === 1);
    expect(owed).toHaveLength(1);
    expect(owed[0]!.bucket_start).toBe(yesterdayBucket().toISOString());
    expect(owed[0]!.missed).toBe(1);
    const future = res.stats["jobs.schedule.future"]!;
    expect(future.every((b) => b.expected === 0 && b.missed === 0)).toBe(true);
  });

  it("cron → expected/missed are null everywhere (NATS owns cron)", async () => {
    findAll.mockClear();
    findAll.mockResolvedValue([]);
    listRowsBySubjects.mockResolvedValue([
      schedRow("jobs.schedule.cron", { schedule_spec: "0 3 * * *" }),
    ]);
    const res = (await runStats({ schedule_subjects: ["jobs.schedule.cron"] })) as StatsRes;
    expect(res.stats["jobs.schedule.cron"]!.every((b) => b.expected === null && b.missed === null)).toBe(true);
  });

  it("the arm window bounds the debt — disarmed_at stops the expected clock", async () => {
    findAll.mockClear();
    findAll.mockResolvedValue([]);
    const armed = new Date();
    armed.setUTCHours(0, 0, 0, 0);
    armed.setUTCDate(armed.getUTCDate() - 15);
    const disarmed = new Date(armed.getTime() + 5 * 86_400_000);
    listRowsBySubjects.mockResolvedValue([schedRow("jobs.schedule.daily", { armed_at: armed, disarmed_at: disarmed })]);
    const res = (await runStats({ schedule_subjects: ["jobs.schedule.daily"] })) as StatsRes;
    const owed = res.stats["jobs.schedule.daily"]!.map((b) => b.expected ?? 0);
    // 5-day arm window → exactly 5 owed fires, none after the disarm.
    expect(owed.reduce((a, b) => a + b, 0)).toBe(5);
  });
});
