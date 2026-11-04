/**
 * `assertTriggerShape` — delegates to the SAME core predicate the superform
 * applies (`jobTriggerShapeIssues`): one rule, two surfaces. Asserts the
 * i18n keys the shared predicate emits (never duplicated literals) and the
 * merge-with-existing semantics the write hook relies on for PATCH bodies.
 */
import "reflect-metadata";
import { describe, expect, it, vi } from "vitest";

vi.mock("@primebrick/sdk", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@primebrick/sdk")>()),
  NatsClient: { jetstreamPublish: vi.fn(async () => {}) },
  makeMarkerAuditPort: () => ({}),
  logger: { done: () => {}, warn: () => {}, info: () => {}, error: () => {}, debug: () => {} },
}));
vi.mock("../../db/dal.js", () => ({
  getDal: () => ({ entityService: () => ({}), tableAuditPort: () => ({}) }),
}));
vi.mock("../../db/entity-repo.js", () => ({ entityActor: {} }));
vi.mock("../../services/callable-catalog.js", () => ({
  callableSubjects: async () => new Set(["emailsender.send"]),
}));

const { assertTriggerShape } = await import("../modules/jobs/jobs.service.js");

const atFuture = `@at ${new Date(Date.now() + 3_600_000).toISOString()}`;
const atPast = `@at ${new Date(Date.now() - 3_600_000).toISOString()}`;

describe("assertTriggerShape — create", () => {
  it("rejects a body with neither event_subject nor schedule_spec", async () => {
    await expect(assertTriggerShape({}, true)).rejects.toThrow(/trigger_source_or_schedule/);
  });

  it("accepts schedule-only (pure timer)", async () => {
    await expect(
      assertTriggerShape({ schedule_spec: "@every 1d", execution_context: "me" }, true),
    ).resolves.toBeUndefined();
  });

  it("accepts event-only (immediate dispatch)", async () => {
    await expect(
      assertTriggerShape({ event_subject: "customer.updated", execution_context: "user" }, true),
    ).resolves.toBeUndefined();
  });

  it("accepts event + schedule (gated timer)", async () => {
    await expect(
      assertTriggerShape(
        { event_subject: "customer.updated", schedule_spec: "@every 1d", execution_context: "user" },
        true,
      ),
    ).resolves.toBeUndefined();
  });

  it("rejects execution_context user without an event source", async () => {
    await expect(
      assertTriggerShape({ schedule_spec: "@every 1d", execution_context: "user" }, true),
    ).rejects.toThrow(/user_context_requires_source/);
  });

  it("accepts execution_context me/system schedule-only", async () => {
    for (const ctx of ["me", "system"]) {
      await expect(
        assertTriggerShape({ schedule_spec: "@every 1d", execution_context: ctx }, true),
      ).resolves.toBeUndefined();
    }
  });

  it("rejects a one-shot @at lying in the past — it could never fire", async () => {
    await expect(
      assertTriggerShape({ schedule_spec: atPast, execution_context: "system" }, true),
    ).rejects.toThrow(/schedule_spec_past/);
  });

  it("accepts a one-shot @at in the future", async () => {
    await expect(
      assertTriggerShape({ schedule_spec: atFuture, execution_context: "system" }, true),
    ).resolves.toBeUndefined();
  });
});

describe("assertTriggerShape — update (partial bodies)", () => {
  const existing = { event_subject: "customer.updated", schedule_spec: "@every 1d", execution_context: "system" };
  const loadExisting = async () => existing;

  it("allows clearing one field while the other survives in the stored row", async () => {
    await expect(assertTriggerShape({ event_subject: null }, false, loadExisting)).resolves.toBeUndefined();
    await expect(assertTriggerShape({ schedule_spec: null }, false, loadExisting)).resolves.toBeUndefined();
  });

  it("rejects clearing the event source while execution_context stays user", async () => {
    const userExisting = { event_subject: "customer.updated", execution_context: "user" };
    await expect(
      assertTriggerShape({ event_subject: null }, false, async () => userExisting),
    ).rejects.toThrow(/user_context_requires_source/);
  });

  it("rejects clearing both in one write", async () => {
    await expect(
      assertTriggerShape({ event_subject: null, schedule_spec: null }, false, loadExisting),
    ).rejects.toThrow(/trigger_source_or_schedule/);
    await expect(
      assertTriggerShape({ event_subject: "", schedule_spec: "" }, false, loadExisting),
    ).rejects.toThrow(/trigger_source_or_schedule/);
  });

  it("rejects switching to execution_context user while clearing the source", async () => {
    await expect(
      assertTriggerShape({ event_subject: null, execution_context: "user" }, false, loadExisting),
    ).rejects.toThrow(/user_context_requires_source/);
  });

  it("allows execution_context user when the source is untouched", async () => {
    await expect(assertTriggerShape({ execution_context: "user" }, false, loadExisting)).resolves.toBeUndefined();
  });

  it("rejects an update whose merged row lands @at in the past", async () => {
    await expect(
      assertTriggerShape({ schedule_spec: atPast }, false, loadExisting),
    ).rejects.toThrow(/schedule_spec_past/);
  });
});
