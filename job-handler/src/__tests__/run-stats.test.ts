/**
 * `POST /actions/job-run-stats` — the response is a ZERO-FILLED bucket
 * grid over the span (position = time; the FE renders slots by index and
 * the last slot is always the current bucket). The trigger-keyed request
 * variant must resolve `jobs.schedule.job.<uuid>` subjects server-side and
 * return stats keyed by the submitted uuid (the FE sparkline binds
 * `row_key:"uuid"`).
 */

import { describe, expect, it, vi } from "vitest";

const findAll = vi.fn();
vi.mock("../db/dal.js", () => ({ getDal: () => ({ findAll }) }));
vi.mock("../services/schedule-service.js", () => ({
  disarmSchedule: vi.fn(),
  dropScheduleMirror: vi.fn(),
  getLastReconcileReport: vi.fn(),
  getScheduleRow: vi.fn(),
  requestOwnerRearm: vi.fn(),
  scheduleDrift: vi.fn(),
  unsuppressSchedule: vi.fn(),
}));
vi.mock("../services/triggers-engine.js", () => ({ refreshTrigger: vi.fn() }));
vi.mock("../nats/schedule-mechanism.js", () => ({ listJobScheduleSubjects: vi.fn() }));

import { runStats } from "../controllers/http/actions-route.js";

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

const statsRow = (subject: string) => ({
  schedule_subject: subject,
  bucket_start: yesterdayBucket(),
  succeeded: 3n,
  failed: 1n,
  skipped: 0n,
});

type StatsRes = { bucket_unit: string; stats: Record<string, { bucket_start: string; succeeded: number; failed: number; skipped: number }[]> };

describe("runStats", () => {
  it("empty subjects → empty stats without querying", async () => {
    findAll.mockClear();
    expect(await runStats({})).toEqual({ bucket_unit: "day", stats: {} });
    expect(findAll).not.toHaveBeenCalled();
  });

  it("schedule_subjects → zero-filled grid, counts land at their bucket position", async () => {
    findAll.mockClear();
    findAll.mockResolvedValue([statsRow("jobs.schedule.heartbeat")]);
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
  });

  it("subject with no runs → full zero grid (the never-ran story)", async () => {
    findAll.mockClear();
    findAll.mockResolvedValue([]);
    const res = (await runStats({ schedule_subjects: ["jobs.schedule.never"] })) as StatsRes;
    const series = res.stats["jobs.schedule.never"]!;
    expect(series.length).toBeGreaterThanOrEqual(30);
    expect(series.every((b) => b.succeeded === 0 && b.failed === 0 && b.skipped === 0)).toBe(true);
  });

  it("trigger_uuids → resolves mirror subjects, responds keyed by uuid", async () => {
    findAll.mockClear();
    findAll.mockResolvedValue([statsRow("jobs.schedule.job.t-1")]);
    const res = (await runStats({ trigger_uuids: ["t-1"] })) as StatsRes;
    const series = res.stats["t-1"]!;
    expect(series.find((b) => b.failed === 1)?.bucket_start).toBe(yesterdayBucket().toISOString());
    expect(res.stats["jobs.schedule.job.t-1"]).toBeUndefined();
    // The SQL filter must have received the resolved mirror subject.
    const filter = findAll.mock.calls[0]?.[2]?.filters?.[0];
    expect(JSON.stringify(filter)).toContain("jobs.schedule.job.t-1");
  });
});
