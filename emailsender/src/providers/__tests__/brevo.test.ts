/**
 * Layer 1 unit test — BrevoClient.mapStatus()
 *
 * Pure synchronous function: no I/O, no DB, no network, no mocks.
 * Verifies every entry in the status map plus the unknown-event passthrough.
 */
import { describe, it, expect } from "vitest";
import { BrevoClient } from "../brevo.js";

describe("BrevoClient.mapStatus", () => {
  // Construct with dummy values — mapStatus does not use the API key or endpoint.
  const client = new BrevoClient("dummy-key", "http://localhost:0");

  it("maps 'sent' → 'sent'", () => {
    expect(client.mapStatus("sent")).toBe("sent");
  });

  it("maps 'delivered' → 'delivered'", () => {
    expect(client.mapStatus("delivered")).toBe("delivered");
  });

  it("maps 'opened' → 'opened'", () => {
    expect(client.mapStatus("opened")).toBe("opened");
  });

  it("maps 'clicked' → 'clicked'", () => {
    expect(client.mapStatus("clicked")).toBe("clicked");
  });

  it("maps 'bounce' → 'bounced'", () => {
    expect(client.mapStatus("bounce")).toBe("bounced");
  });

  it("maps 'hardbounce' → 'bounced'", () => {
    expect(client.mapStatus("hardbounce")).toBe("bounced");
  });

  it("maps 'softbounce' → 'bounced'", () => {
    expect(client.mapStatus("softbounce")).toBe("bounced");
  });

  it("maps 'spam' → 'spam'", () => {
    expect(client.mapStatus("spam")).toBe("spam");
  });

  it("maps 'blocked' → 'blocked'", () => {
    expect(client.mapStatus("blocked")).toBe("blocked");
  });

  it("maps 'deferred' → 'deferred'", () => {
    expect(client.mapStatus("deferred")).toBe("deferred");
  });

  it("maps 'invalid' → 'failed'", () => {
    expect(client.mapStatus("invalid")).toBe("failed");
  });

  it("maps 'error' → 'failed'", () => {
    expect(client.mapStatus("error")).toBe("failed");
  });

  it("passes through unknown events unchanged", () => {
    expect(client.mapStatus("some_unknown_event")).toBe("some_unknown_event");
    expect(client.mapStatus("")).toBe("");
  });
});
