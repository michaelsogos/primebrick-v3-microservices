/**
 * triggers-engine — the three execution paths off `job.job_triggers`:
 *
 *   event + schedule → matching event arms the schedule, non-match disarms
 *   event only       → matching event publishes the forward envelope on
 *                      the due trampoline (no JetStream schedule)
 *   schedule only    → arms at boot/reload, no event gate
 *
 * Lane semantics: "user" forwards the event's auth headers (refused when
 * absent or when no source exists); "me" resolves the trigger author via
 * auth.ctl.resolve_user at arm time (refused when unresolvable); "system"
 * carries no user context.
 */
import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobTriggerEntity } from "../domain/entities/job_trigger_entity.js";

const h = vi.hoisted(() => ({
  publish: vi.fn(async (_subject?: unknown, _payload?: unknown, _headers?: unknown) => {}),
  jetstreamSubscribe: vi.fn(async (_opts?: unknown) => {}),
  subscribeShielded: vi.fn(async (_subject?: unknown, _handler?: unknown) => {}),
  callNats: vi.fn(async (_subject?: unknown, _data?: unknown) => null as unknown),
  findAll: vi.fn(async () => [] as JobTriggerEntity[]),
  declareSchedule: vi.fn(async (_opts?: unknown) => {}),
  disarmSchedule: vi.fn(async (_subject?: unknown, _initiator?: unknown) => {}),
  reset() {
    this.publish.mockClear();
    this.jetstreamSubscribe.mockClear();
    this.subscribeShielded.mockClear();
    this.callNats.mockReset();
    this.callNats.mockResolvedValue(null);
    this.findAll.mockReset();
    this.findAll.mockResolvedValue([]);
    this.declareSchedule.mockClear();
    this.disarmSchedule.mockClear();
  },
}));

vi.mock("@primebrick/sdk", async (importOriginal) => {
  const real = await importOriginal<typeof import("@primebrick/sdk")>();
  const pickAuth = (headers?: Record<string, string>) =>
    Object.fromEntries(Object.entries(headers ?? {}).filter(([k]) => k.startsWith("x-user-")));
  return {
    ...real,
    NatsClient: {
      publish: h.publish,
      jetstreamSubscribe: h.jetstreamSubscribe,
      jetstreamPublish: vi.fn(async () => {}),
    },
    subscribeShielded: h.subscribeShielded,
    callNats: h.callNats,
    getAuthConfig: () => ({}),
    serializeAuthUserToHeaders: (user: { user_uuid?: string }) => ({
      "x-user-id": String(user.user_uuid ?? ""),
      "x-resolved": "yes",
    }),
    forwardAuthHeaders: (msg: { headers?: Record<string, string> }) => pickAuth(msg.headers),
    forwardedActor: (msg: { headers?: Record<string, string> }) => ({
      actor_uuid: msg.headers?.["x-user-id"],
      actor_locale: msg.headers?.["x-user-locale"],
    }),
    dueLaneVerify: () => async () => ({}),
    logger: { done: () => {}, warn: () => {}, info: () => {}, error: () => {}, debug: () => {} },
  };
});
vi.mock("../db/dal.js", () => ({ getDal: () => ({ findAll: h.findAll, add: vi.fn(async () => ({})) }) }));
vi.mock("../services/schedule-service.js", () => ({
  declareSchedule: h.declareSchedule,
  disarmSchedule: h.disarmSchedule,
}));
vi.mock("../services/run-recorder.js", () => ({ JOBS_STREAM: "JOBS" }));

let startTriggersEngine: () => Promise<void>;
beforeEach(async () => {
  h.reset();
  vi.resetModules();
  ({ startTriggersEngine } = await import("../services/triggers-engine.js"));
});

const mkTrigger = (over: Record<string, unknown>): JobTriggerEntity =>
  ({
    uuid: "trig-1",
    name: "trig",
    target_subject: "emailsender.send",
    execution_context: "user",
    enabled: true,
    created_by: "author-1",
    payload_map: {},
    ...over,
  }) as unknown as JobTriggerEntity;

/** Run the engine with the given triggers live, returning the captured
 *  subject → event-handler map and the reload-tap handler. */
async function boot(triggers: JobTriggerEntity[]) {
  h.findAll.mockResolvedValue(triggers);
  await startTriggersEngine();
  const events = new Map<string, (payload: unknown, msg: { headers?: Record<string, string> }) => Promise<unknown>>();
  for (const c of h.subscribeShielded.mock.calls) events.set(c[0] as string, c[1] as never);
  const reload = h.jetstreamSubscribe.mock.calls
    .map((c) => c[0] as { durable: string; handler: (d: { trigger_uuid?: string }) => Promise<void> })
    .find((o) => o.durable === "job-triggers-reloader")?.handler;
  return { events, reload };
}

const userMsg = { headers: { "x-user-id": "actor-9", "x-user-locale": "it-IT" } };

describe("triggers-engine — event + schedule (gated timer)", () => {
  const gated = () =>
    mkTrigger({
      event_subject: "customer.updated",
      schedule_spec: "@every 1d",
      filter: [{ field: "vip", op: "eq", value: true }],
    });

  it("a matching event arms the schedule on the user forward trampoline", async () => {
    const { events } = await boot([gated()]);
    await events.get("customer.updated")!({ vip: true }, userMsg);

    expect(h.declareSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        schedule_subject: "jobs.schedule.job.trig",
        schedule: "@every 1d",
        target: "jobs.due.user.job.forward.trig-1",
        kind: "trigger",
        mirror_target: "emailsender.send",
        trigger_uuid: "trig-1",
        forwardHeaders: { "x-user-id": "actor-9", "x-user-locale": "it-IT" },
        payload: expect.objectContaining({
          target: "emailsender.send",
          payload: { vip: true },
          schedule_subject: "jobs.schedule.job.trig",
        }),
      }),
    );
    expect(h.publish).not.toHaveBeenCalled(); // gated → armed, not fired
  });

  it("a non-matching event disarms (fail-closed)", async () => {
    const { events } = await boot([gated()]);
    await events.get("customer.updated")!({ vip: false }, userMsg);

    expect(h.declareSchedule).not.toHaveBeenCalled();
    expect(h.disarmSchedule).toHaveBeenCalledWith(
      "jobs.schedule.job.trig",
      expect.stringContaining("trigger"),
    );
  });
});

describe("triggers-engine — event only (immediate dispatch)", () => {
  const immediate = () =>
    mkTrigger({ uuid: "trig-2", name: "imm", event_subject: "order.placed", schedule_spec: undefined });

  it("a matching event publishes the envelope on the due trampoline — no schedule", async () => {
    const { events } = await boot([immediate()]);
    await events.get("order.placed")!({ order_id: "o-1" }, userMsg);

    expect(h.declareSchedule).not.toHaveBeenCalled();
    expect(h.publish).toHaveBeenCalledWith(
      "jobs.due.user.job.forward.trig-2",
      expect.objectContaining({ target: "emailsender.send", payload: { order_id: "o-1" } }),
      { "x-user-id": "actor-9", "x-user-locale": "it-IT" },
    );
  });

  it("a non-matching event does nothing (nothing armed to disarm)", async () => {
    const { events } = await boot([
      mkTrigger({
        ...immediate(),
        filter: [{ field: "kind", op: "eq", value: "b2b" }],
      } as never),
    ]);
    await events.get("order.placed")!({ kind: "b2c" }, userMsg);

    expect(h.publish).not.toHaveBeenCalled();
    expect(h.declareSchedule).not.toHaveBeenCalled();
    expect(h.disarmSchedule).not.toHaveBeenCalled();
  });
});

describe("triggers-engine — schedule only (pure timer)", () => {
  it("system lane arms at boot on the system trampoline", async () => {
    await boot([
      mkTrigger({
        uuid: "trig-3",
        name: "timer",
        event_subject: undefined,
        schedule_spec: "@every 1h",
        execution_context: "system",
      }),
    ]);

    expect(h.subscribeShielded).not.toHaveBeenCalled();
    expect(h.declareSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ target: "jobs.due.system.job.forward.trig-3", kind: "trigger" }),
    );
  });

  it("me lane resolves the author via auth.ctl.resolve_user and rides the user lane", async () => {
    h.callNats.mockResolvedValue({ user_uuid: "author-7" });
    await boot([
      mkTrigger({
        uuid: "trig-4",
        name: "mine",
        event_subject: undefined,
        schedule_spec: "@every 1h",
        execution_context: "me",
        created_by: "author-7",
      }),
    ]);

    expect(h.callNats).toHaveBeenCalledWith("auth.ctl.resolve_user", { user_uuid: "author-7" });
    expect(h.declareSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        target: "jobs.due.user.job.forward.trig-4",
        forwardHeaders: { "x-user-id": "author-7", "x-resolved": "yes" },
      }),
    );
  });

  it("me lane with an unresolvable author refuses to arm (fail-closed)", async () => {
    h.callNats.mockResolvedValue(null); // author deleted/disabled
    await boot([
      mkTrigger({
        uuid: "trig-5",
        event_subject: undefined,
        schedule_spec: "@every 1h",
        execution_context: "me",
      }),
    ]);

    expect(h.declareSchedule.mock.calls.filter((c) => String((c[0] as { trigger_uuid?: string }).trigger_uuid) === "trig-5")).toHaveLength(0);
  });

  it("user lane on a schedule-only trigger refuses (no event to forward auth from)", async () => {
    await boot([
      mkTrigger({
        uuid: "trig-6",
        event_subject: undefined,
        schedule_spec: "@every 1h",
        execution_context: "user",
      }),
    ]);

    expect(h.declareSchedule.mock.calls.filter((c) => String((c[0] as { trigger_uuid?: string }).trigger_uuid) === "trig-6")).toHaveLength(0);
  });
});

describe("triggers-engine — user lane auth requirements", () => {
  it("an event without auth headers refuses a user-lane dispatch", async () => {
    const { events } = await boot([
      mkTrigger({ uuid: "trig-7", event_subject: "customer.updated", schedule_spec: "@every 1d" }),
    ]);
    await events.get("customer.updated")!({ any: "thing" }, { headers: {} });

    expect(h.declareSchedule).not.toHaveBeenCalled();
    expect(h.publish).not.toHaveBeenCalled();
  });
});

describe("triggers-engine — reload tap", () => {
  it("jobs.ctl.triggers.changed re-reads the trigger and re-arms its new shape", async () => {
    const live = mkTrigger({
      uuid: "trig-8",
      event_subject: "customer.updated",
      schedule_spec: "@every 1d",
    });
    const { reload } = await boot([live]);
    expect(reload).toBeDefined();

    // Trigger re-shaped to schedule-only → reload disarms the old timer
    // (prev.schedule_spec) and arms the new shape directly.
    h.findAll.mockResolvedValue([
      mkTrigger({ uuid: "trig-8", event_subject: undefined, schedule_spec: "@every 2h", execution_context: "system" }),
    ]);
    await reload!({ trigger_uuid: "trig-8" });

    expect(h.disarmSchedule).toHaveBeenCalledWith("jobs.schedule.job.trig", expect.any(String));
    expect(h.declareSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ target: "jobs.due.system.job.forward.trig-8", schedule: "@every 2h" }),
    );
  });

  it("disabling a trigger disarms its timer and stops event dispatch", async () => {
    const live = mkTrigger({ uuid: "trig-9", event_subject: "customer.updated", schedule_spec: "@every 1d" });
    const { events, reload } = await boot([live]);

    h.findAll.mockResolvedValue([mkTrigger({ uuid: "trig-9", enabled: false, schedule_spec: "@every 1d" })]);
    await reload!({ trigger_uuid: "trig-9" });

    expect(h.disarmSchedule).toHaveBeenCalledWith("jobs.schedule.job.trig", expect.any(String));
    await events.get("customer.updated")!({ x: 1 }, userMsg);
    expect(h.declareSchedule.mock.calls.filter((c) => String((c[0] as { trigger_uuid?: string }).trigger_uuid) === "trig-9")).toHaveLength(0);
    expect(h.publish).not.toHaveBeenCalled();
  });
});
