/**
 * due-forwarder — the fire-time auth-freshness checkpoint + run-result
 * correlation. Every scheduled/immediate dispatch funnels through
 * `forward()`, so this is the single mechanical point where stale arm-time
 * authorization is caught AND where the `x-job-run-id` /
 * `x-job-schedule-subject` correlation headers are stamped for the SDK
 * transport middleware's `jobs.result.*` report.
 *
 * Policies under test (header comment in due-forwarder.ts is the
 * contract):
 *   cache hit & fresh   → serialized snapshot headers, no re-resolve
 *   miss / stale epoch  → re-resolve via auth.ctl.resolve_user
 *   resolve null        → REFUSE the fire (deleted/disabled actor)
 *   resolve unreachable → fall back to the message's own headers
 *   system lane         → checkpoint skipped entirely
 *   schedule_subject    → stamped verbatim + one-shot marked fired
 *   run row uuid        → stamped as x-job-run-id for result correlation
 */
import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dalPgMock } from "./mock-dal.js";

const h = vi.hoisted(() => {
  const cache = new Map<string, unknown>();
  return {
    cache,
    publish: vi.fn(async (_subject?: unknown, _payload?: unknown, _headers?: unknown) => {}),
    jetstreamSubscribe: vi.fn(async (_opts?: unknown) => {}),
    callNats: vi.fn(async (_subject?: unknown, _data?: unknown) => null as unknown),
    addRun: vi.fn(async (_entity?: unknown, _body?: unknown, _opts?: unknown) => ({ uuid: "run-uuid-1" })),
    findRuns: vi.fn(async () => []),
    updateRun: vi.fn(async () => ({})),
    markFired: vi.fn(async (_subject?: unknown) => {}),
    // `armed` by default — the due-lane suppression gate consults it;
    // suppressed statuses are covered by dedicated cases.
    getScheduleRow: vi.fn(async () => ({ status: "armed" })),
    reset() {
      this.cache.clear();
      this.publish.mockClear();
      this.jetstreamSubscribe.mockClear();
      this.callNats.mockReset();
      this.callNats.mockResolvedValue(null);
      this.addRun.mockClear();
      this.addRun.mockResolvedValue({ uuid: "run-uuid-1" });
      this.findRuns.mockClear();
      this.updateRun.mockClear();
      this.markFired.mockClear();
      this.getScheduleRow.mockClear();
      this.getScheduleRow.mockResolvedValue({ status: "armed" });
    },
  };
});

vi.mock("@primebrick/sdk", async (importOriginal) => {
  const real = await importOriginal<typeof import("@primebrick/sdk")>();
  const pickAuth = (headers?: Record<string, string>) =>
    Object.fromEntries(Object.entries(headers ?? {}).filter(([k]) => k.startsWith("x-user-")));
  return {
    ...real,
    NatsClient: { publish: h.publish, jetstreamSubscribe: h.jetstreamSubscribe },
    callNats: h.callNats,
    getSdkCachePort: () => ({
      get: async (key: string) => (h.cache.has(key) ? h.cache.get(key) : null),
      set: async (key: string, value: unknown) => void h.cache.set(key, value),
    }),
    getAuthConfig: () => ({}),
    // Deterministic serializer — "x-resolved" marks headers produced from a
    // resolved AuthUser, distinguishing them from verbatim arm-time headers.
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
vi.mock("@primebrick/dal-pg", async (importOriginal) =>
  dalPgMock({ add: h.addRun, findAll: h.findRuns, update: h.updateRun }, importOriginal),
);
vi.mock("../services/schedule-service.js", () => ({
  markScheduleFired: h.markFired,
  getScheduleRow: h.getScheduleRow,
}));

const { startDueForwarder, FORWARD_ENVELOPE_MARK } = await import("../services/due-forwarder.js");

type Lane = "user" | "system";
type SubOpts = {
  durable: string;
  handler: (
    data: unknown,
    msg: { headers?: Record<string, string>; info?: { streamSequence?: number | bigint } },
  ) => Promise<void>;
};

const envelope = (over: Record<string, unknown> = {}) => ({
  [FORWARD_ENVELOPE_MARK]: true,
  target: "emailsender.send",
  payload: { to: "a@b.c" },
  schedule_subject: "jobs.schedule.job.trig",
  initiator: "trigger:trig",
  ...over,
});

async function handlerFor(lane: Lane): Promise<SubOpts["handler"]> {
  h.jetstreamSubscribe.mockClear();
  await startDueForwarder();
  const opts = h.jetstreamSubscribe.mock.calls.map((c) => c[0] as SubOpts);
  const sub = opts.find((o) => o.durable === `job-due-forwarder-${lane}`);
  if (!sub) throw new Error(`no ${lane}-lane durable bound`);
  return sub.handler;
}

/** Real `JsMsg.headers` is `MsgHdrs` (`.get(k)`); mocked `forwardAuthHeaders`
 *  above still indexes the same object — support both on one shape. */
const hdrs = (o: Record<string, string>) =>
  Object.assign({}, o, { get: (k: string) => o[k] });
/** Fixture trigger uuid — rides the trampoline subject tail, the only
 *  lineage proof a due message needs. */
const TRIG_UUID = "00000000-0000-7000-8000-000000000001";
const userMsg = (uuid: string) => ({
  subject: `jobs.due.user.job.forward.${TRIG_UUID}`,
  headers: hdrs({ "x-user-id": uuid, "x-user-locale": "en-GB" }),
});
const emptyMsg = () => ({ subject: `jobs.due.system.job.forward.${TRIG_UUID}`, headers: hdrs({}) });

const published = () =>
  h.publish.mock.calls.map((c) => ({ subject: c[0] as string, payload: c[1], headers: c[2] as Record<string, string> }));

const recorded = () => h.addRun.mock.calls.map((c) => c[1] as Record<string, unknown>);

/** Correlation headers stamped on every dispatch — contract for the result middleware. */
const corr = {
  "x-job-schedule-subject": "jobs.schedule.job.trig",
  "x-job-run-id": "run-uuid-1",
  "x-job-trigger-id": TRIG_UUID,
};

beforeEach(() => h.reset());

describe("due-forwarder — user lane auth checkpoint", () => {
  it("fresh snapshot hit → republishes with serialized headers, no re-resolve", async () => {
    const handler = await handlerFor("user");
    h.cache.set("auth:snap:actor-1", { user: { user_uuid: "actor-1" }, taken_at: 1000 });
    h.cache.set("auth:epoch", 500);
    h.cache.set("auth:user_epoch:actor-1", 400);

    await handler(envelope(), userMsg("actor-1"));

    expect(h.callNats).not.toHaveBeenCalled();
    expect(published()).toEqual([
      {
        subject: "emailsender.send",
        payload: { to: "a@b.c" },
        headers: { "x-user-id": "actor-1", "x-resolved": "yes", ...corr },
      },
    ]);
    expect(recorded().some((r) => r.status === "dispatched")).toBe(true);
  });

  it("cache miss → resolves via auth.ctl.resolve_user, publishes fresh, stores snapshot", async () => {
    const handler = await handlerFor("user");
    h.callNats.mockResolvedValue({ user_uuid: "actor-2" });

    await handler(envelope(), userMsg("actor-2"));

    expect(h.callNats).toHaveBeenCalledWith("auth.ctl.resolve_user", { user_uuid: "actor-2" });
    expect(published()[0].headers).toEqual({ "x-user-id": "actor-2", "x-resolved": "yes", ...corr });
    const snap = h.cache.get("auth:snap:actor-2") as { user: { user_uuid: string }; taken_at: number };
    expect(snap.user.user_uuid).toBe("actor-2");
    expect(snap.taken_at).toBeGreaterThan(0);
  });

  it("stale snapshot (epoch bumped after resolve) → re-resolves", async () => {
    const handler = await handlerFor("user");
    h.cache.set("auth:snap:actor-3", { user: { user_uuid: "actor-3" }, taken_at: 100 });
    h.cache.set("auth:epoch", 200); // role/permission write happened after the snapshot
    h.callNats.mockResolvedValue({ user_uuid: "actor-3" });

    await handler(envelope(), userMsg("actor-3"));

    expect(h.callNats).toHaveBeenCalledWith("auth.ctl.resolve_user", { user_uuid: "actor-3" });
    expect(published()[0].headers).toEqual({ "x-user-id": "actor-3", "x-resolved": "yes", ...corr });
  });

  it("resolve returns null (actor deleted/disabled) → fire refused, run recorded failed", async () => {
    const handler = await handlerFor("user");
    h.callNats.mockResolvedValue(null);

    await handler(envelope(), userMsg("actor-4"));

    expect(h.publish).not.toHaveBeenCalled();
    expect(recorded()).toEqual([
      // Even refused fires carry trigger lineage — the trampoline tail
      // proves the dispatch was trigger-originated.
      expect.objectContaining({ status: "failed", error_code: "AUTH_ACTOR_UNRESOLVABLE", trigger_uuid: TRIG_UUID }),
    ]);
  });

  it("resolve unreachable → throws (handler naks), nothing published, no run", async () => {
    const handler = await handlerFor("user");
    h.callNats.mockRejectedValue(new Error("nats timeout"));

    // Throwing defers the fire to the next redelivery — forwarding arm-time
    // headers would let the callable accept STALE claims (roles frozen at
    // arm time), bypassing this very checkpoint. Unverifiable authorization
    // is never forwarded.
    await expect(handler(envelope(), userMsg("actor-5"))).rejects.toThrow(/unreachable/);
    expect(h.publish).not.toHaveBeenCalled();
    expect(recorded()).toEqual([]);
  });
});

describe("due-forwarder — run-result correlation", () => {
  it("stamps x-job-run-id from the recorded row uuid", async () => {
    const handler = await handlerFor("system");
    h.addRun.mockResolvedValue({ uuid: "run-uuid-42" });

    await handler(envelope(), emptyMsg());

    expect(published()[0].headers["x-job-run-id"]).toBe("run-uuid-42");
  });

  it("dispatched run rows resolve trigger_uuid from the trampoline subject tail", async () => {
    const handler = await handlerFor("system");

    await handler(envelope(), emptyMsg());

    // `trigger_uuid` = the dispatch lineage proof (the trampoline tail IS
    // the trigger); the consumed callable lands on `target_subject` —
    // never the other way around. No `name` column exists to stamp.
    expect(recorded()[0]).toMatchObject({
      trigger_uuid: TRIG_UUID,
      target_subject: "emailsender.send",
      status: "dispatched",
    });
    expect(recorded()[0]).not.toHaveProperty("name");
    expect(recorded()[0]).not.toHaveProperty("service_code");
  });

  it("the armed mirror's trigger_uuid wins over the trampoline tail — and stamps the header", async () => {
    const handler = await handlerFor("system");
    h.getScheduleRow.mockResolvedValue({ status: "armed", trigger_uuid: "trig-9" } as never);

    await handler(envelope(), emptyMsg());

    expect(recorded()[0].trigger_uuid).toBe("trig-9");
    expect(published()[0].headers["x-job-trigger-id"]).toBe("trig-9");
  });

  it("an immediate dispatch resolves trigger_uuid from the subject tail and stamps the header", async () => {
    const handler = await handlerFor("system");

    await handler(envelope({ schedule_subject: undefined }), emptyMsg());

    expect(recorded()[0].trigger_uuid).toBe(TRIG_UUID);
    expect(published()[0].headers["x-job-trigger-id"]).toBe(TRIG_UUID);
  });

  it("marks a one-shot schedule fired after the dispatch attempt", async () => {
    const handler = await handlerFor("system");

    await handler(envelope(), emptyMsg());

    // No Nats-Schedule-Next on this fired message → nextFire stays undefined.
    expect(h.markFired).toHaveBeenCalledWith("jobs.schedule.job.trig", undefined);
  });

  it("stamps fire_seq from the due message's stream sequence", async () => {
    const handler = await handlerFor("system");
    await handler(envelope(), { headers: hdrs({}), info: { streamSequence: 1175 } });
    expect(recorded()[0]).toMatchObject({ status: "dispatched", fire_seq: 1175n });
  });

  it("a suppressed due keeps fire_seq on the skipped row", async () => {
    const handler = await handlerFor("system");
    h.getScheduleRow.mockResolvedValue({ status: "paused", trigger_uuid: "trig-9" } as never);
    await handler(envelope(), { headers: hdrs({}), info: { streamSequence: 42 } });
    expect(recorded()[0]).toMatchObject({
      status: "skipped",
      // `schedule ${status}` interpolations are normalized to the closed
      // enum — a badge column can never carry a raw string.
      error_code: "SCHEDULE_PAUSED",
      error_detail: "suppressed: schedule status is paused",
      trigger_uuid: "trig-9",
      fire_seq: 42n,
    });
  });

  it("stamps schedule_uuid + trigger_uuid from the armed schedule row", async () => {
    const handler = await handlerFor("system");
    h.getScheduleRow.mockResolvedValue({ status: "paused", trigger_uuid: "trig-9", uuid: "sched-5" } as never);
    await handler(envelope(), { headers: hdrs({}), info: { streamSequence: 43 } });
    expect(recorded()[0]).toMatchObject({
      trigger_uuid: "trig-9",
      schedule_uuid: "sched-5",
    });
  });

  it("a suppressed disarmed schedule maps to its own enum code", async () => {
    const handler = await handlerFor("system");
    h.getScheduleRow.mockResolvedValue({ status: "disarmed" } as never);
    await handler(envelope(), { headers: hdrs({}), info: { streamSequence: 7 } });
    expect(recorded()[0]).toMatchObject({ status: "skipped", error_code: "SCHEDULE_DISARMED" });
  });

  it("dispatched rows stamp lineage: trigger_uuid + schedule_uuid + target_subject", async () => {
    const handler = await handlerFor("system");
    h.getScheduleRow.mockResolvedValue({ status: "armed", trigger_uuid: "trig-9", uuid: "sched-5" } as never);

    await handler(envelope(), emptyMsg());

    // trigger_uuid/schedule_uuid = stamped at fire time (survive schedule
    // churn); target_subject = the consumed callable (envelope.target).
    expect(recorded()[0]).toMatchObject({
      status: "dispatched",
      trigger_uuid: "trig-9",
      schedule_uuid: "sched-5",
      target_subject: "emailsender.send",
    });
  });

  it("an immediate envelope (no schedule_subject) skips both schedule stamps", async () => {
    const handler = await handlerFor("system");

    await handler(envelope({ schedule_subject: undefined }), emptyMsg());

    expect(published()[0].headers["x-job-schedule-subject"]).toBeUndefined();
    expect(published()[0].headers["x-job-run-id"]).toBe("run-uuid-1");
    expect(h.markFired).not.toHaveBeenCalled();
  });
});

describe("due-forwarder — envelope handling", () => {
  it("system lane skips the checkpoint entirely", async () => {
    const handler = await handlerFor("system");
    h.cache.set("auth:epoch", 999);

    await handler(envelope(), emptyMsg());

    expect(h.callNats).not.toHaveBeenCalled();
    expect(published()[0]).toMatchObject({ subject: "emailsender.send" });
  });

  it("malformed envelope is dropped", async () => {
    const handler = await handlerFor("user");
    await handler({ no_mark: true }, userMsg("actor-6"));
    expect(h.publish).not.toHaveBeenCalled();
  });

  it("non-callable target is refused before any auth work", async () => {
    const handler = await handlerFor("user");
    await handler(envelope({ target: "no.dot.here!!" }), userMsg("actor-7"));
    expect(h.publish).not.toHaveBeenCalled();
    expect(h.callNats).not.toHaveBeenCalled();
  });
});
