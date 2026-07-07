/**
 * Layer 1 unit test — WebhookService.handleWebhook() validation
 *
 * Pure unit tests: no DB, no network, no vi.mock. The WebhookService is
 * constructed with an injected BrevoClient (DI refactor) so no env vars are
 * needed. The validation checks (unsupported provider, missing message-id,
 * missing event) throw BEFORE getDal() is reached — so no DB connection is
 * ever attempted.
 *
 * Cases:
 *  1. unsupported provider → throws "Unsupported provider: <name>"
 *  2. missing message-id → throws "Missing message-id in webhook payload"
 *  3. missing event → throws "Missing event in webhook payload"
 */
import { describe, it, expect } from "vitest";
import { WebhookService } from "../webhook-service.js";
import { BrevoClient } from "../../providers/brevo.js";

// Inject a dummy BrevoClient — mapStatus is a pure function, no network.
const dummyBrevo = new BrevoClient("dummy-key", "http://localhost:0");
const svc = new WebhookService(dummyBrevo);

describe("WebhookService.handleWebhook — validation (throws before DB)", () => {
  it("throws on unsupported provider", async () => {
    await expect(svc.handleWebhook("sendgrid", {})).rejects.toThrow(
      "Unsupported provider: sendgrid",
    );
  });

  it("throws on missing message-id", async () => {
    await expect(
      svc.handleWebhook("brevo", { event: "delivered" }),
    ).rejects.toThrow("Missing message-id in webhook payload");
  });

  it("throws on missing event", async () => {
    await expect(
      svc.handleWebhook("brevo", { "message-id": "msg-123" }),
    ).rejects.toThrow("Missing event in webhook payload");
  });

  it("throws on empty payload", async () => {
    await expect(svc.handleWebhook("brevo", {})).rejects.toThrow(
      "Missing message-id in webhook payload",
    );
  });
});
