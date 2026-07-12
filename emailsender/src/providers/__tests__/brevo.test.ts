/**
 * Layer 1 unit test — BrevoClient.mapStatus()
 *
 * Pure synchronous static function: no I/O, no DB, no network, no mocks.
 * Verifies every entry in the status map plus the unknown-event passthrough.
 */
import { describe, it, expect } from "vitest";
import { BrevoClient } from "../brevo.js";

describe("BrevoClient.mapStatus", () => {
  it("maps 'sent' → 'sent'", () => {
    expect(BrevoClient.mapStatus("sent")).toBe("sent");
  });

  it("maps 'delivered' → 'delivered'", () => {
    expect(BrevoClient.mapStatus("delivered")).toBe("delivered");
  });

  it("maps 'opened' → 'opened'", () => {
    expect(BrevoClient.mapStatus("opened")).toBe("opened");
  });

  it("maps 'clicked' → 'clicked'", () => {
    expect(BrevoClient.mapStatus("clicked")).toBe("clicked");
  });

  it("maps 'bounce' → 'bounced'", () => {
    expect(BrevoClient.mapStatus("bounce")).toBe("bounced");
  });

  it("maps 'hardbounce' → 'bounced'", () => {
    expect(BrevoClient.mapStatus("hardbounce")).toBe("bounced");
  });

  it("maps 'softbounce' → 'bounced'", () => {
    expect(BrevoClient.mapStatus("softbounce")).toBe("bounced");
  });

  it("maps 'spam' → 'spam'", () => {
    expect(BrevoClient.mapStatus("spam")).toBe("spam");
  });

  it("maps 'blocked' → 'blocked'", () => {
    expect(BrevoClient.mapStatus("blocked")).toBe("blocked");
  });

  it("maps 'deferred' → 'deferred'", () => {
    expect(BrevoClient.mapStatus("deferred")).toBe("deferred");
  });

  it("maps 'invalid' → 'failed'", () => {
    expect(BrevoClient.mapStatus("invalid")).toBe("failed");
  });

  it("maps 'error' → 'failed'", () => {
    expect(BrevoClient.mapStatus("error")).toBe("failed");
  });

  it("passes through unknown events unchanged", () => {
    expect(BrevoClient.mapStatus("some_unknown_event")).toBe("some_unknown_event");
    expect(BrevoClient.mapStatus("")).toBe("");
  });
});
