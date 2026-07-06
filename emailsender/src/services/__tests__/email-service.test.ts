/**
 * Unit tests for EmailService.sendEmail() — the method exposed via the
 * NATS `emailsender.send` subject.
 *
 * Pure unit tests: the Dal gateway and BrevoClient are mocked. No DB, no
 * NATS, no Brevo network calls.
 *
 * Cases:
 *  1. success — config + template found, Brevo sends, success log inserted
 *  2. config not found — NotFoundError on config lookup, failure log inserted
 *  3. template not found — NotFoundError on template lookup, failure log inserted
 *  4. Brevo send fails — failure log inserted with error_message
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// --- Mocks (hoisted by vitest above the EmailService import) ---

const findMock = vi.fn();
const addMock = vi.fn();
vi.mock("../../db/dal.js", () => ({
  getDal: () => ({ find: findMock, add: addMock }),
}));

const sendEmailMock = vi.fn();
vi.mock("../../providers/brevo.js", () => ({
  BrevoClient: class MockBrevoClient {
    sendEmail = sendEmailMock;
    mapStatus = (event: string) => event;
  },
}));

// --- System under test ---

import { EmailService } from "../email-service.js";
import { EmailCommunicationLogEntity } from "../../domain/entities/registry.js";
import { NotFoundError } from "@primebrick/dal-pg";

const baseRequest = {
  requestId: "req-1",
  templateCode: "WELCOME",
  languageIso: "en",
  to: ["alice@example.com"],
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.BREVO_API_KEY = "test-key";
});

describe("EmailService.sendEmail", () => {
  it("success: returns success:true + providerMessageId + logId, logs status:sent", async () => {
    findMock
      .mockResolvedValueOnce({
        provider: "brevo",
        from_email: "no-reply@example.com",
        from_name: "Example",
        reply_to: null,
      }) // config lookup
      .mockResolvedValueOnce({
        uuid: "tpl-uuid-123",
        subject: "Hi {{name}}",
        body_html: "<b>{{name}}</b>",
        body_text: "{{name}}",
      }); // template lookup
    sendEmailMock.mockResolvedValue({ messageId: "brevo-msg-1" });
    addMock.mockResolvedValue({ id: 42 });

    const svc = new EmailService();
    const res = await svc.sendEmail({ ...baseRequest, variables: { name: "Alice" } });

    expect(res.success).toBe(true);
    expect(res.providerMessageId).toBe("brevo-msg-1");
    expect(res.logId).toBe(42);

    // Exactly one add() call — the success log
    expect(addMock).toHaveBeenCalledTimes(1);
    const [entity, payload] = addMock.mock.calls[0];
    expect(entity).toBe(EmailCommunicationLogEntity);
    expect(payload.status).toBe("sent");
    expect(payload.provider_message_id).toBe("brevo-msg-1");
    expect(payload.template_uuid).toBe("tpl-uuid-123");
    expect(payload.type).toBe("email");
    expect(payload.provider).toBe("brevo");
  });

  it("config not found: logs status:failed, returns success:false", async () => {
    findMock.mockRejectedValueOnce(new NotFoundError("no brevo config"));
    addMock.mockResolvedValue({ id: 1 });

    const svc = new EmailService();
    const res = await svc.sendEmail({ ...baseRequest });

    expect(res.success).toBe(false);
    expect(res.error).toBe("No email configuration found for Brevo");

    // Failure log inserted
    expect(addMock).toHaveBeenCalledTimes(1);
    const [, payload] = addMock.mock.calls[0];
    expect(payload.status).toBe("failed");
    expect(payload.provider_message_id).toBeUndefined(); // failure log omits it
    expect(payload.template_uuid).toBeNull();
  });

  it("template not found: logs status:failed, returns success:false", async () => {
    findMock
      .mockResolvedValueOnce({ provider: "brevo", from_email: "no-reply@example.com" }) // config ok
      .mockRejectedValueOnce(new NotFoundError("no template")); // template missing
    addMock.mockResolvedValue({ id: 2 });

    const svc = new EmailService();
    const res = await svc.sendEmail({ ...baseRequest });

    expect(res.success).toBe(false);
    expect(res.error).toBe("Template not found: WELCOME (en)");

    const [, payload] = addMock.mock.calls[0];
    expect(payload.status).toBe("failed");
  });

  it("brevo send fails: logs status:failed with error_message, returns success:false", async () => {
    findMock
      .mockResolvedValueOnce({ provider: "brevo", from_email: "no-reply@example.com" })
      .mockResolvedValueOnce({
        uuid: "tpl-uuid",
        subject: "S",
        body_html: "H",
        body_text: "T",
      });
    sendEmailMock.mockRejectedValue(new Error("brevo down"));
    addMock.mockResolvedValue({ id: 3 });

    const svc = new EmailService();
    const res = await svc.sendEmail({ ...baseRequest });

    expect(res.success).toBe(false);
    expect(res.error).toBe("brevo down");

    const [, payload] = addMock.mock.calls[0];
    expect(payload.status).toBe("failed");
    expect(payload.error_message).toBe("brevo down");
  });
});
