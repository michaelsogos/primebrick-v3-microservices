/**
 * `POST /actions/job-run-stats` — the trigger-keyed request variant must
 * resolve `jobs.schedule.job.<uuid>` subjects server-side and return stats
 * keyed by the submitted uuid (the FE sparkline binds `row_key:"uuid"`).
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

const BUCKET = new Date("2026-03-01T00:00:00Z");
const statsRow = (subject: string) => ({
  schedule_subject: subject,
  bucket_start: BUCKET,
  succeeded: 3n,
  failed: 1n,
  skipped: 0n,
});

describe("runStats", () => {
  it("empty subjects → empty stats without querying", async () => {
    findAll.mockClear();
    expect(await runStats({})).toEqual({ bucket_unit: "day", stats: {} });
    expect(findAll).not.toHaveBeenCalled();
  });

  it("schedule_subjects → stats keyed by subject", async () => {
    findAll.mockClear();
    findAll.mockResolvedValue([statsRow("jobs.schedule.heartbeat")]);
    const res = (await runStats({ schedule_subjects: ["jobs.schedule.heartbeat"] })) as {
      stats: Record<string, { succeeded: number }[]>;
    };
    expect(res.stats["jobs.schedule.heartbeat"]?.[0]?.succeeded).toBe(3);
  });

  it("trigger_uuids → resolves mirror subjects, responds keyed by uuid", async () => {
    findAll.mockClear();
    findAll.mockResolvedValue([statsRow("jobs.schedule.job.t-1")]);
    const res = (await runStats({ trigger_uuids: ["t-1"] })) as {
      stats: Record<string, { failed: number }[]>;
    };
    expect(res.stats["t-1"]?.[0]?.failed).toBe(1);
    expect(res.stats["jobs.schedule.job.t-1"]).toBeUndefined();
    // The SQL filter must have received the resolved mirror subject.
    const filter = findAll.mock.calls[0]?.[2]?.filters?.[0];
    expect(JSON.stringify(filter)).toContain("jobs.schedule.job.t-1");
  });
});
