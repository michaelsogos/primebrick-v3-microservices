/**
 * WebhookService ordering guard — out-of-order Brevo events must not
 * regress sender_log.status.
 */
import { describe, it, expect, vi } from "vitest";
import { makeEntityService } from "@primebrick/dal-pg";

const findMock = vi.fn();
const updateMock = vi.fn(async () => ({}));

import { WebhookService } from "../webhook-service.js";

const svc = new WebhookService();
// DomainService seam — the repo stub backs both this.dal reads and
// this.svc writes (entityService delegates to the same dal instance).
const dalStub = { find: findMock, update: updateMock };
(svc as unknown as { _dal: unknown })._dal = {
  ...dalStub,
  entityService: (cfg: Record<string, unknown>) =>
    makeEntityService({ ...cfg, repo: cfg.repo ?? dalStub } as never),
};
const MSG = { "message-id": "msg-1", event: "sent" };

describe("WebhookService — status ordering guard", () => {
  it("skips a lower-rank event after a higher-rank status", async () => {
    findMock.mockResolvedValue({ uuid: "log-1", status: "delivered" });
    updateMock.mockClear();
    // "sent" (rank 1) arriving after "delivered" (rank 2) → ignored
    await svc.handleWebhook("brevo", MSG);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("applies a higher-rank event", async () => {
    findMock.mockResolvedValue({ uuid: "log-1", status: "sent" });
    updateMock.mockClear();
    await svc.handleWebhook("brevo", { "message-id": "msg-1", event: "delivered" });
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it("applies a same-rank event (idempotent dedupe)", async () => {
    findMock.mockResolvedValue({ uuid: "log-1", status: "delivered" });
    updateMock.mockClear();
    await svc.handleWebhook("brevo", { "message-id": "msg-1", event: "delivered" });
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it("throws NotFoundError when the log row does not exist yet", async () => {
    // Same contract as the old matchBy update (RecordVanishedError on 0
    // rows): a webhook for an unknown message-id surfaces as an error.
    findMock.mockResolvedValue(null);
    updateMock.mockClear();
    await expect(svc.handleWebhook("brevo", MSG)).rejects.toThrow(/not found/i);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
