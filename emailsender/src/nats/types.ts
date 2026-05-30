export interface SendEmailRequest {
  requestId: string;
  templateCode: string;
  languageIso: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  variables?: Record<string, unknown>;
  entityTable?: string;
  entityId?: number;
  entityUuid?: string;
}

export interface SendEmailResponse {
  requestId: string;
  success: boolean;
  providerMessageId?: string;
  error?: string;
  logId?: number;
}

export interface WebhookUpdateRequest {
  provider: string;
  providerMessageId: string;
  status: string;
  errorMessage?: string;
}
