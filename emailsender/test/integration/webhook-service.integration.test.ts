/**
 * Layer 2 integration test — WebhookService.handleWebhook()
 *
 * Full code path: real PostgreSQL via getDal() gateway. The WebhookService is
 * constructed with an injected BrevoClient (DI refactor) so no env vars needed.
 * No vi.mock() calls.
 *
 * Cases:
 *  1. delivered event — updates log status from "sent" to "delivered"
 *  2. bounce event with reason — updates status to "bounced" + error_message
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { BrevoClient } from "../../src/providers/brevo.js";
import { WebhookService } from "../../src/services/webhook-service.js";
import { EmailCommunicationLogEntity } from "../../src/domain/entities/registry.js";
import {
  initTestDal,
  setupTestSchema,
  truncateTestTables,
  closeTestDal,
  getDal,
} from "../helpers/setup.js";

beforeAll(async () => {
  initTestDal();
  await setupTestSchema();
});

afterAll(async () => {
  await closeTestDal();
});

beforeEach(async () => {
  await truncateTestTables();
});

/**
 * Helper: insert a communication log row directly via the DAL, simulating a
 * log that was created by a prior sendEmail() call.
 */
async function seedLog(providerMessageId: string, status: string): Promise<EmailCommunicationLogEntity> {
  const dal = getDal();
  return dal.add<EmailCommunicationLogEntity>(
    EmailCommunicationLogEntity,
    {
      type: "email",
      provider_message_id: providerMessageId,
      provider: "brevo",
      status,
      senders: { from: "no-reply@example.com" },
      recipients: { to: ["alice@example.com"] },
      sent_at: new Date(),
      status_changed_at: new Date(),
    },
    {},
  );
}

describe("WebhookService.handleWebhook — integration (real PG)", () => {
  it("delivered event: updates log status from 'sent' to 'delivered'", async () => {
    await seedLog("msg-123", "sent");

    const svc = new WebhookService(new BrevoClient("dummy-key", "http://localhost:0"));
    await svc.handleWebhook("brevo", {
      "message-id": "msg-123",
      event: "delivered",
    });

    // Verify the row was updated
    const dal = getDal();
    const updated = await dal.find<EmailCommunicationLogEntity>(EmailCommunicationLogEntity, null, {});
    // find() with no filters throws if 0 or >1 rows — use findAll instead
    const rows = await dal.findAll<EmailCommunicationLogEntity>(EmailCommunicationLogEntity, null, {});
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe("delivered");
    expect(rows[0].provider_message_id).toBe("msg-123");
    expect(rows[0].status_changed_at).toBeDefined();
  });

  it("bounce event with reason: updates status to 'bounced' + sets error_message", async () => {
    await seedLog("msg-456", "sent");

    const svc = new WebhookService(new BrevoClient("dummy-key", "http://localhost:0"));
    await svc.handleWebhook("brevo", {
      "message-id": "msg-456",
      event: "bounce",
      reason: "user does not exist",
    });

    const dal = getDal();
    const rows = await dal.findAll<EmailCommunicationLogEntity>(EmailCommunicationLogEntity, null, {});
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe("bounced");
    expect(rows[0].error_message).toBe("user does not exist");
  });

  it("hardbounce event: maps to 'bounced' status", async () => {
    await seedLog("msg-789", "sent");

    const svc = new WebhookService(new BrevoClient("dummy-key", "http://localhost:0"));
    await svc.handleWebhook("brevo", {
      "message-id": "msg-789",
      event: "hardbounce",
    });

    const dal = getDal();
    const rows = await dal.findAll<EmailCommunicationLogEntity>(EmailCommunicationLogEntity, null, {});
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe("bounced");
    // No reason provided → error_message stays undefined (not set in the update payload)
  });
});
