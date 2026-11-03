/**
 * `assertTriggerShape` — the write-path contract that mirrors the form's
 * `job_trigger_shape` validator: `event_subject` and `schedule_spec` are
 * mutually mandatory (at least one), and `execution_context "user"` needs
 * an event source to forward auth headers from.
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

describe("assertTriggerShape — create", () => {
  it("rejects a body with neither event_subject nor schedule_spec", () => {
    expect(() => assertTriggerShape({}, true)).toThrow(/at least one of/);
  });

  it("accepts schedule-only (pure timer)", () => {
    expect(() =>
      assertTriggerShape({ schedule_spec: "@every 1d", execution_context: "me" }, true),
    ).not.toThrow();
  });

  it("accepts event-only (immediate dispatch)", () => {
    expect(() =>
      assertTriggerShape({ event_subject: "customer.updated", execution_context: "user" }, true),
    ).not.toThrow();
  });

  it("accepts event + schedule (gated timer)", () => {
    expect(() =>
      assertTriggerShape(
        { event_subject: "customer.updated", schedule_spec: "@every 1d", execution_context: "user" },
        true,
      ),
    ).not.toThrow();
  });

  it("rejects execution_context user without an event source", () => {
    expect(() =>
      assertTriggerShape({ schedule_spec: "@every 1d", execution_context: "user" }, true),
    ).toThrow(/requires an event source/);
  });

  it("accepts execution_context me/system schedule-only", () => {
    for (const ctx of ["me", "system"]) {
      expect(() =>
        assertTriggerShape({ schedule_spec: "@every 1d", execution_context: ctx }, true),
      ).not.toThrow();
    }
  });
});

describe("assertTriggerShape — update (partial bodies)", () => {
  it("allows clearing one field while the other survives", () => {
    expect(() => assertTriggerShape({ event_subject: null }, false)).not.toThrow();
    expect(() => assertTriggerShape({ schedule_spec: null }, false)).not.toThrow();
  });

  it("rejects clearing both in one write", () => {
    expect(() => assertTriggerShape({ event_subject: null, schedule_spec: null }, false)).toThrow(
      /clearing both/,
    );
    expect(() => assertTriggerShape({ event_subject: "", schedule_spec: "" }, false)).toThrow(
      /clearing both/,
    );
  });

  it("rejects switching to execution_context user while clearing the source", () => {
    expect(() =>
      assertTriggerShape({ event_subject: null, execution_context: "user" }, false),
    ).toThrow(/requires an event source/);
  });

  it("allows execution_context user when the source is untouched", () => {
    expect(() => assertTriggerShape({ execution_context: "user" }, false)).not.toThrow();
  });
});
