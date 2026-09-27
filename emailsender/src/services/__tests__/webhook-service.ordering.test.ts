/**
 * WebhookService ordering guard — out-of-order Brevo events must not
 * regress sender_log.status.
 */
import { describe, it, expect, vi } from "vitest";

const findMock = vi.fn();
const updateMock = vi.fn(async () => ({}));

vi.mock("../../db/dal.js", () => ({
  getDal: () => ({ find: findMock, update: updateMock }),
}));

import { WebhookService } from "../webhook-service.js";

const svc = new WebhookService();
const MSG = { "message-id": "msg-1", event: "sent" };

describe("WebhookService — status ordering guard", () => {
  it("skips a lower-rank event after a higher-rank status", async () => {
    findMock.mockResolvedValue({ status: "delivered" });
    updateMock.mockClear();
    // "sent" (rank 1) arriving after "delivered" (rank 2) → ignored
    await svc.handleWebhook("brevo", MSG);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("applies a higher-rank event", async () => {
    findMock.mockResolvedValue({ status: "sent" });
    updateMock.mockClear();
    await svc.handleWebhook("brevo", { "message-id": "msg-1", event: "delivered" });
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it("applies a same-rank event (idempotent dedupe)", async () => {
    findMock.mockResolvedValue({ status: "delivered" });
    updateMock.mockClear();
    await svc.handleWebhook("brevo", { "message-id": "msg-1", event: "delivered" });
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it("updates when the log row does not exist yet (update errors surface)", async () => {
    findMock.mockResolvedValue(null);
    updateMock.mockClear();
    await svc.handleWebhook("brevo", MSG);
    expect(updateMock).toHaveBeenCalledTimes(1);
  });
});
