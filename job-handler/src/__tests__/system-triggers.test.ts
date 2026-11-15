/**
 * system-triggers — the materialize reconcile for module-declared jobs.
 *
 * Under test (the delta-only write matrix):
 *   absent row        → INSERT seeded with the whole declaration
 *   deleted row       → skipped_deleted — a soft-deleted system trigger
 *                       is user disablement, NEVER resurrected
 *   code-owned drift  → UPDATE only the drifted fields; user-owned
 *                       `schedule_spec`/`name` are never written
 *   no drift          → zero writes, no changed broadcast
 *   jsonb echo        → a key-reordered payload_map is NOT drift
 */
import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  findAll: vi.fn(async (..._args: unknown[]) => [] as unknown[]),
  add: vi.fn(async (..._args: unknown[]) => ({})),
  update: vi.fn(async (..._args: unknown[]) => ({})),
  publishChanged: vi.fn(),
  reset() {
    this.findAll.mockReset();
    this.findAll.mockResolvedValue([]);
    this.add.mockReset();
    this.add.mockResolvedValue({});
    this.update.mockReset();
    this.update.mockResolvedValue({});
    this.publishChanged.mockReset();
  },
}));

vi.mock("../db/dal.js", () => ({
  getDal: () => ({ findAll: h.findAll, add: h.add, update: h.update }),
}));
vi.mock("../modules/jobs/jobs.service.js", () => ({
  publishTriggerChanged: h.publishChanged,
}));
vi.mock("@primebrick/sdk", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@primebrick/sdk")>()),
  logger: { done: () => {}, warn: () => {}, info: () => {}, error: () => {}, debug: () => {} },
}));

const { materializeSystemJobs } = await import("../services/system-triggers.js");

const decl = (over: Record<string, unknown> = {}) => ({
  key: "ai.partition_maintenance",
  name: "AI partition maintenance",
  schedule_spec: "@every 6h",
  target_subject: "ai.partition_maintenance",
  run_as: "system" as const,
  ...over,
});

const row = (over: Record<string, unknown> = {}) => ({
  uuid: "trig-uuid-1",
  name: "Renamed by the user",
  system_key: "ai.partition_maintenance",
  event_subject: null,
  schedule_spec: "@every 1h", // user-governed — differs from the decl on purpose
  target_subject: "ai.partition_maintenance",
  payload_map: null,
  filter: null,
  run_as: "system",
  deleted_at: null,
  ...over,
});

beforeEach(() => h.reset());

describe("materializeSystemJobs", () => {
  it("inserts the declaration when no row exists", async () => {
    const res = await materializeSystemJobs("ai", [decl({ payload_map: { limit: "100" } })]);
    expect(res).toEqual([
      expect.objectContaining({ key: "ai.partition_maintenance", action: "inserted" }),
    ]);
    expect(h.add).toHaveBeenCalledTimes(1);
    const added = h.add.mock.calls[0]![1] as Record<string, unknown>;
    expect(added).toMatchObject({
      system_key: "ai.partition_maintenance",
      name: "AI partition maintenance",
      schedule_spec: "@every 6h",
      target_subject: "ai.partition_maintenance",
      payload_map: { limit: "100" },
      run_as: "system",
    });
    expect(h.add.mock.calls[0]![2]).toMatchObject({ actor: "system:ai" });
    expect(h.publishChanged).toHaveBeenCalledTimes(1);
  });

  it("updates ONLY the drifted code-owned field, never user-owned ones", async () => {
    h.findAll.mockResolvedValue([row({ target_subject: "ai.old_target" })]);
    const res = await materializeSystemJobs("ai", [decl()]);
    expect(res).toEqual([
      expect.objectContaining({ action: "updated", changed_fields: ["target_subject"] }),
    ]);
    const patch = h.update.mock.calls[0]![1] as Record<string, unknown>;
    expect(patch).toEqual({ uuid: "trig-uuid-1", target_subject: "ai.partition_maintenance" });
    expect(patch).not.toHaveProperty("schedule_spec");
    expect(patch).not.toHaveProperty("name");
    expect(h.publishChanged).toHaveBeenCalledTimes(1);
  });

  it("is a pure read when nothing drifted — no write, no broadcast", async () => {
    h.findAll.mockResolvedValue([row()]);
    const res = await materializeSystemJobs("ai", [decl()]);
    expect(res).toEqual([expect.objectContaining({ action: "unchanged" })]);
    expect(h.add).not.toHaveBeenCalled();
    expect(h.update).not.toHaveBeenCalled();
    expect(h.publishChanged).not.toHaveBeenCalled();
  });

  it("a key-reordered jsonb echo is NOT drift", async () => {
    h.findAll.mockResolvedValue([
      row({ payload_map: { b: "2", a: "1" } }),
    ]);
    const res = await materializeSystemJobs("ai", [
      decl({ payload_map: { a: "1", b: "2" } }),
    ]);
    expect(res).toEqual([expect.objectContaining({ action: "unchanged" })]);
    expect(h.update).not.toHaveBeenCalled();
  });

  it("NEVER resurrects a soft-deleted row — skipped_deleted, zero writes", async () => {
    h.findAll.mockResolvedValue([
      row({ deleted_at: new Date(), target_subject: "ai.old_target" }),
    ]);
    const res = await materializeSystemJobs("ai", [decl()]);
    expect(res).toEqual([expect.objectContaining({ action: "skipped_deleted" })]);
    expect(h.add).not.toHaveBeenCalled();
    expect(h.update).not.toHaveBeenCalled();
    expect(h.publishChanged).not.toHaveBeenCalled();
  });

  it("cleared decl field reconciles to NULL when the row still carries it", async () => {
    h.findAll.mockResolvedValue([row({ payload_map: { limit: "100" } })]);
    const res = await materializeSystemJobs("ai", [decl()]);
    expect(res).toEqual([
      expect.objectContaining({ action: "updated", changed_fields: ["payload_map"] }),
    ]);
    const patch = h.update.mock.calls[0]![1] as Record<string, unknown>;
    expect(patch.payload_map).toBeNull();
  });
});
