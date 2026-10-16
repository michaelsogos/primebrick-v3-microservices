export interface SendEmailRequest {
  requestId: string;
  templateCode: string;
  languageIso: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  variables?: Record<string, unknown>;
  entityTable?: string;
  entityId?: bigint;
  entityUuid?: string;
  /** Audit metadata — the real session actor that triggered the send
   *  (the authorizing identity is the synthetic is_system user). */
  initiatedBy?: string;
}

export interface SendEmailResponse {
  requestId: string;
  success: boolean;
  providerMessageId?: string;
  error?: string;
  logId?: bigint;
}

export interface WebhookUpdateRequest {
  provider: string;
  providerMessageId: string;
  status: string;
  errorMessage?: string;
}
