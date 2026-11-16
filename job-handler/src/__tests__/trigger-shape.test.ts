/**
 * `assertTriggerShape` — delegates to the SAME core predicate the superform
 * applies (`jobTriggerShapeIssues`): one rule, two surfaces. Asserts the
 * i18n keys the shared predicate emits (never duplicated literals) and the
 * merge-with-existing semantics the write hook relies on for PATCH bodies.
 */
import "reflect-metadata";
import { describe, expect, it, vi } from "vitest";
import { dalPgMock } from "./mock-dal.js";

vi.mock("@primebrick/sdk", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@primebrick/sdk")>()),
  NatsClient: { jetstreamPublish: vi.fn(async () => {}) },
  makeMarkerAuditPort: () => ({}),
  logger: { done: () => {}, warn: () => {}, info: () => {}, error: () => {}, debug: () => {} },
}));
vi.mock("@primebrick/dal-pg", async (importOriginal) =>
  dalPgMock({ entityService: () => ({}), tableAuditPort: () => ({}) }, importOriginal),
);
vi.mock("../../services/callable-catalog.js", () => ({
  callableSubjects: async () => new Set(["emailsender.send"]),
}));

const { assertTriggerShape, assertSystemTriggerMutable } = await import("../modules/jobs/jobs.service.js");

const atFuture = `@at ${new Date(Date.now() + 3_600_000).toISOString()}`;
const atPast = `@at ${new Date(Date.now() - 3_600_000).toISOString()}`;

describe("assertTriggerShape — create", () => {
  it("rejects a body with neither event_subject nor schedule_spec", async () => {
    await expect(assertTriggerShape({}, true)).rejects.toThrow(/trigger_source_or_schedule/);
  });

  it("accepts schedule-only (pure timer)", async () => {
    await expect(
      assertTriggerShape({ schedule_spec: "@every 1d", run_as: "author" }, true),
    ).resolves.toBeUndefined();
  });

  it("accepts event-only (immediate dispatch)", async () => {
    await expect(
      assertTriggerShape({ event_subject: "customer.updated", run_as: "originator" }, true),
    ).resolves.toBeUndefined();
  });

  it("accepts event + schedule (gated timer)", async () => {
    await expect(
      assertTriggerShape(
        { event_subject: "customer.updated", schedule_spec: "@every 1d", run_as: "originator" },
        true,
      ),
    ).resolves.toBeUndefined();
  });

  it("rejects run_as originator without an event source", async () => {
    await expect(
      assertTriggerShape({ schedule_spec: "@every 1d", run_as: "originator" }, true),
    ).rejects.toThrow(/originator_requires_source/);
  });

  it("rejects a run_as outside the closed vocab", async () => {
    await expect(
      assertTriggerShape({ event_subject: "customer.updated", run_as: "bogus" }, true),
    ).rejects.toThrow(/not_in_vocab/);
  });

  it("accepts run_as author/system schedule-only", async () => {
    for (const ctx of ["author", "system"]) {
      await expect(
        assertTriggerShape({ schedule_spec: "@every 1d", run_as: ctx }, true),
      ).resolves.toBeUndefined();
    }
  });

  it("rejects a one-shot @at lying in the past — it could never fire", async () => {
    await expect(
      assertTriggerShape({ schedule_spec: atPast, run_as: "system" }, true),
    ).rejects.toThrow(/schedule_spec_past/);
  });

  it("accepts a one-shot @at in the future", async () => {
    await expect(
      assertTriggerShape({ schedule_spec: atFuture, run_as: "system" }, true),
    ).resolves.toBeUndefined();
  });
});

describe("assertTriggerShape — update (partial bodies)", () => {
  const existing = { event_subject: "customer.updated", schedule_spec: "@every 1d", run_as: "system" };
  const loadExisting = async () => existing;

  it("allows clearing one field while the other survives in the stored row", async () => {
    await expect(assertTriggerShape({ event_subject: null }, false, loadExisting)).resolves.toBeUndefined();
    await expect(assertTriggerShape({ schedule_spec: null }, false, loadExisting)).resolves.toBeUndefined();
  });

  it("rejects clearing the event source while run_as stays originator", async () => {
    const userExisting = { event_subject: "customer.updated", run_as: "originator" };
    await expect(
      assertTriggerShape({ event_subject: null }, false, async () => userExisting),
    ).rejects.toThrow(/originator_requires_source/);
  });

  it("rejects clearing both in one write", async () => {
    await expect(
      assertTriggerShape({ event_subject: null, schedule_spec: null }, false, loadExisting),
    ).rejects.toThrow(/trigger_source_or_schedule/);
    await expect(
      assertTriggerShape({ event_subject: "", schedule_spec: "" }, false, loadExisting),
    ).rejects.toThrow(/trigger_source_or_schedule/);
  });

  it("rejects switching to run_as originator while clearing the source", async () => {
    await expect(
      assertTriggerShape({ event_subject: null, run_as: "originator" }, false, loadExisting),
    ).rejects.toThrow(/originator_requires_source/);
  });

  it("allows run_as originator when the source is untouched", async () => {
    await expect(assertTriggerShape({ run_as: "originator" }, false, loadExisting)).resolves.toBeUndefined();
  });

  it("rejects an update whose merged row lands @at in the past", async () => {
    await expect(
      assertTriggerShape({ schedule_spec: atPast }, false, loadExisting),
    ).rejects.toThrow(/schedule_spec_past/);
  });
});

// assertSystemTriggerMutable — the wire-side frozen-set rule. The FE's
// depends_on.set gate is UX; this hook is the fail-closed mirror: a
// hand-crafted API payload must hit the same wall.
describe("assertSystemTriggerMutable", () => {
  const systemRow = {
    uuid: "t1",
    name: "Partition maintenance",
    system_key: "ai.partition-maintenance",
    event_subject: null,
    schedule_spec: "@every 1d",
    target_subject: "ai.partition_maintenance",
    payload_map: { scope: { kind: "const", value: "all" } },
    filter: [{ field: "a", op: "eq", value: 1 }],
    run_as: "system",
  };

  it("create: rejects a body that claims a system_key", () => {
    expect(() =>
      assertSystemTriggerMutable({ system_key: "x.y", name: "n" }, true),
    ).toThrow(/system_trigger_immutable/);
  });

  it("create: a user trigger without system_key passes", () => {
    expect(() => assertSystemTriggerMutable({ name: "n" }, true)).not.toThrow();
    expect(() => assertSystemTriggerMutable({ name: "n", system_key: null }, true)).not.toThrow();
  });

  it("update: a user row stays fully editable", () => {
    const userRow = { ...systemRow, system_key: null };
    expect(() =>
      assertSystemTriggerMutable({ target_subject: "other.call" }, false, userRow),
    ).not.toThrow();
  });

  it("update: changing a frozen field on a system row is rejected", () => {
    for (const [field, value] of [
      ["event_subject", "a.b.c"],
      ["target_subject", "other.call"],
      ["run_as", "author"],
      ["payload_map", { x: { kind: "const", value: 1 } }],
      ["filter", []],
    ] as const) {
      expect(() => assertSystemTriggerMutable({ [field]: value }, false, systemRow), field).toThrow(
        /system_trigger_immutable/,
      );
    }
  });

  it("update: user-owned fields (schedule_spec, name) stay writable on system rows", () => {
    expect(() =>
      assertSystemTriggerMutable({ schedule_spec: "@every 4h", name: "renamed" }, false, systemRow),
    ).not.toThrow();
  });

  it("update: a verbatim echo of a frozen value is not a mutation", () => {
    expect(() =>
      assertSystemTriggerMutable(
        { target_subject: "ai.partition_maintenance", payload_map: { scope: { kind: "const", value: "all" } } },
        false,
        systemRow,
      ),
    ).not.toThrow();
  });

  it("update: key-ordered jsonb is not a false positive", () => {
    // Same object, different key order — canonical compare must not reject.
    expect(() =>
      assertSystemTriggerMutable({ filter: [{ value: 1, op: "eq", field: "a" }] }, false, systemRow),
    ).not.toThrow();
  });

  it("update: system_key itself can never be written", () => {
    expect(() => assertSystemTriggerMutable({ system_key: "other.key" }, false, systemRow)).toThrow(
      /system_trigger_immutable/,
    );
    expect(() =>
      assertSystemTriggerMutable({ system_key: "x.y" }, false, { ...systemRow, system_key: null }),
    ).toThrow(/system_trigger_immutable/);
  });
});
