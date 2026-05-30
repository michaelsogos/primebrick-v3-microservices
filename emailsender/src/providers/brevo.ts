export interface BrevoEmailRequest {
  to: Array<{ email: string; name?: string }>;
  cc?: Array<{ email: string; name?: string }>;
  bcc?: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  sender?: { email: string; name?: string };
  replyTo?: { email: string; name?: string };
  tags?: string[];
}

export interface BrevoEmailResponse {
  messageId: string;
  messageIds?: string[];
}

export interface BrevoError {
  code: string;
  message: string;
}

export class BrevoClient {
  private apiKey: string;
  private apiEndpoint: string;

  constructor(apiKey: string, apiEndpoint: string = "https://api.brevo.com/v1") {
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
  }

  async sendEmail(request: BrevoEmailRequest): Promise<BrevoEmailResponse> {
    const url = `${this.apiEndpoint}/smtp/emails`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": this.apiKey,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let error: BrevoError;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { code: response.status.toString(), message: errorText || response.statusText };
      }
      throw new Error(`Brevo API error: ${error.code} - ${error.message}`);
    }

    const data = await response.json() as { messageId: string; messageIds?: string[] };
    return {
      messageId: data.messageId,
      messageIds: data.messageIds,
    };
  }

  mapStatus(brevoStatus: string): string {
    // Map Brevo status to our internal status
    const statusMap: Record<string, string> = {
      "sent": "sent",
      "delivered": "delivered",
      "opened": "opened",
      "clicked": "clicked",
      "bounce": "bounced",
      "spam": "spam",
      "blocked": "blocked",
      "deferred": "deferred",
      "hardbounce": "bounced",
      "softbounce": "bounced",
      "invalid": "failed",
      "error": "failed",
    };
    return statusMap[brevoStatus] || brevoStatus;
  }
}
