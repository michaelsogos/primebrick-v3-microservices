import { describe, expect, it } from "vitest";
import { toNatsScheduleSpec } from "../nats/schedule-mechanism.js";

/**
 * The system grammar is 5-field cron (`minute hour dom mon dow`) — minute
 * floor by design; sub-minute schedules are a different technique, not a
 * job. nats-server ≥2.10 speaks 6-field cron with the seconds field FIRST.
 * The boundary prepends `0 ` so the fire lands exactly at second 0 of each
 * matching minute — `* ` would mean every second, the exact opposite of
 * the minute floor. `@every`/`@at` pass through verbatim.
 */
describe("toNatsScheduleSpec — 5-field system grammar → 6-field NATS wire", () => {
  it("prepends seconds=0 to a plain 5-field cron", () => {
    expect(toNatsScheduleSpec("9 * * * *")).toBe("0 9 * * * *");
  });

  it("preserves complex field shapes (steps, lists, ranges, names)", () => {
    expect(toNatsScheduleSpec("*/15 9-17 * * MON-FRI")).toBe("0 */15 9-17 * * MON-FRI");
    expect(toNatsScheduleSpec("0 0 1 * *")).toBe("0 0 0 1 * *");
    expect(toNatsScheduleSpec("0 0 * * 0")).toBe("0 0 0 * * 0");
  });

  it("collapses the exact 5-field shape — never seconds-prefixed input", () => {
    // A 6-field-looking input is NOT system grammar; it still gets `0 `
    // prefixed (validation upstream rejects it — this function is the
    // boundary, not the validator).
    expect(toNatsScheduleSpec("0 9 * * *")).toBe("0 0 9 * * *");
  });

  it("passes @every through verbatim", () => {
    expect(toNatsScheduleSpec("@every 5m")).toBe("@every 5m");
    expect(toNatsScheduleSpec("@every 1h30m")).toBe("@every 1h30m");
  });

  it("passes @at through verbatim", () => {
    expect(toNatsScheduleSpec("@at 2027-01-01T09:00:00Z")).toBe("@at 2027-01-01T09:00:00Z");
  });

  it("any @-token passes through — aliases stay a validator concern, not the boundary's", () => {
    // If a spec is already @-shaped the boundary must not decorate it;
    // isValidScheduleSpec upstream decides which @-tokens are legal.
    expect(toNatsScheduleSpec("@daily")).toBe("@daily");
  });

  it("trims surrounding whitespace before transforming", () => {
    expect(toNatsScheduleSpec("  9 * * * *  ")).toBe("0 9 * * * *");
    expect(toNatsScheduleSpec("  @every 5m  ")).toBe("@every 5m");
  });
});
