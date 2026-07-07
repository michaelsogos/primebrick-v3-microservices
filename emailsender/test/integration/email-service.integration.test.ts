/**
 * Layer 2 integration test — EmailService.sendEmail()
 *
 * Full code path: real PostgreSQL via getDal() gateway, real fake Brevo HTTP
 * server (not a mock). No vi.mock() calls.
 *
 * Cases:
 *  1. success — provider + template found, Brevo returns 200, success log inserted
 *  2. config not found — no provider row, failure log inserted with status="failed"
 *  3. template not found — provider exists, no template, failure log inserted
 *  4. Brevo error — fake Brevo returns 500, failure log with error_message
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { BrevoClient } from "../../src/providers/brevo.js";
import { EmailService } from "../../src/services/email-service.js";
import { EmailCommunicationLogEntity } from "../../src/domain/entities/registry.js";
import {
  initTestDal,
  setupTestSchema,
  truncateTestTables,
  closeTestDal,
  seedProvider,
  seedTemplate,
  findLogByMessageId,
  getDal,
} from "../helpers/setup.js";
import { startFakeBrevoServer, type FakeBrevoServer } from "../helpers/fake-brevo-server.js";
import { Filter, field } from "@primebrick/dal-pg";

let fakeBrevo: FakeBrevoServer;

beforeAll(async () => {
  initTestDal();
  await setupTestSchema();
  fakeBrevo = await startFakeBrevoServer();
});

afterAll(async () => {
  await fakeBrevo.close();
  await closeTestDal();
});

beforeEach(async () => {
  await truncateTestTables();
});

describe("EmailService.sendEmail — integration (real PG + fake Brevo)", () => {
  it("success: returns success:true + providerMessageId + logId, logs status:sent", async () => {
    await seedProvider();
    await seedTemplate();

    const svc = new EmailService(new BrevoClient("test-key", fakeBrevo.url));
    const res = await svc.sendEmail({
      requestId: "req-1",
      templateCode: "WELCOME",
      languageIso: "en",
      to: ["alice@example.com"],
      variables: { name: "Alice" },
    });

    expect(res.success).toBe(true);
    expect(res.providerMessageId).toBe("fake-msg-id-123");
    expect(res.logId).toBeDefined();

    // Verify the communication log row
    const log = await findLogByMessageId("fake-msg-id-123");
    expect(log).not.toBeNull();
    expect(log!.status).toBe("sent");
    expect(log!.provider).toBe("brevo");
    expect(log!.type).toBe("email");
    expect(log!.template_uuid).toBeDefined();
    expect(log!.sent_at).toBeDefined();
  });

  it("config not found: logs status:failed, returns success:false", async () => {
    // No provider seeded
    await seedTemplate();

    const svc = new EmailService(new BrevoClient("test-key", fakeBrevo.url));
    const res = await svc.sendEmail({
      requestId: "req-2",
      templateCode: "WELCOME",
      languageIso: "en",
      to: ["bob@example.com"],
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe("No email configuration found for Brevo");

    // Verify a failure log was inserted
    const dal = getDal();
    const logs = await dal.findAll<EmailCommunicationLogEntity>(EmailCommunicationLogEntity, null, {
      filters: [Filter.fieldValue(field(EmailCommunicationLogEntity, "status"), "=", "failed")],
    });
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBe(1);
    expect(logs[0].error_message).toBe("No email configuration found for Brevo");
  });

  it("template not found: logs status:failed, returns success:false", async () => {
    await seedProvider();
    // No template seeded

    const svc = new EmailService(new BrevoClient("test-key", fakeBrevo.url));
    const res = await svc.sendEmail({
      requestId: "req-3",
      templateCode: "WELCOME",
      languageIso: "en",
      to: ["carol@example.com"],
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe("Template not found: WELCOME (en)");

    const dal = getDal();
    const logs = await dal.findAll<EmailCommunicationLogEntity>(EmailCommunicationLogEntity, null, {
      filters: [Filter.fieldValue(field(EmailCommunicationLogEntity, "status"), "=", "failed")],
    });
    expect(logs.length).toBe(1);
    expect(logs[0].error_message).toBe("Template not found: WELCOME (en)");
  });

  it("brevo error: logs status:failed with error_message, returns success:false", async () => {
    await seedProvider();
    await seedTemplate();

    // Stop the default fake server and start one that returns 500
    await fakeBrevo.close();
    fakeBrevo = await startFakeBrevoServer({ errorStatus: 500, errorBody: { code: "500", message: "brevo down" } });

    const svc = new EmailService(new BrevoClient("test-key", fakeBrevo.url));
    const res = await svc.sendEmail({
      requestId: "req-4",
      templateCode: "WELCOME",
      languageIso: "en",
      to: ["dave@example.com"],
      variables: { name: "Dave" },
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("brevo down");

    const dal = getDal();
    const logs = await dal.findAll<EmailCommunicationLogEntity>(EmailCommunicationLogEntity, null, {
      filters: [Filter.fieldValue(field(EmailCommunicationLogEntity, "status"), "=", "failed")],
    });
    expect(logs.length).toBe(1);
    expect(logs[0].error_message).toContain("brevo down");

    // Restart the default success server for subsequent tests
    await fakeBrevo.close();
    fakeBrevo = await startFakeBrevoServer();
  });
});
