import { z } from "zod";

/**
 * `emailsender.send` — the ONE declaration of the request contract:
 * `z.infer` is the request type, `z.toJSONSchema` is the census/FE/docs
 * projection, `.parse()` is the mandatory runtime validation wired by the
 * route factory. `x_*` annotations ride in `.meta()` and land verbatim in
 * the emitted JSON Schema.
 *
 * Wire note: ext-json decodes every JSON integer as bigint — `entityId`
 * is `z.bigint()` (the real wire type), emitted to the census as
 * `{"type":"integer"}` via the `unrepresentable` override below.
 */
export const SendEmailSchema = z.object({
  requestId: z.string().min(1).meta({
    description:
      "Unique id for this send — echoed back on emailsender.response.<requestId>. Generated per-dispatch via the `uuid` injector — platform-owned, never caller-authored.",
    x_inject: "uuid",
    x_not_editable: true,
  }),
  templateCode: z.string().min(1).meta({
    description:
      "Code of a row in the sender's template catalog (e.g. customer_high_value). Rendered with `variables`.",
    x_options: {
      api_url: "/svc/emailsender/api/v1/entities/email_template/list",
      api_verb: "GET",
      value_field: "code",
      label_field: "subject",
      icon: "mail",
      icon_color: "sky-500",
      icon_dashed: true,
    },
  }),
  languageIso: z.string().min(1).meta({
    description:
      "The email language — picks which language variant of the template is sent to the recipient (e.g. it-IT, en-US). Uses the standard BCP-47 locale format.",
    x_options: { values_source: "locales" },
  }),
  to: z.array(z.string().email()).min(1).meta({
    description:
      'Recipient addresses — a JSON array, e.g. ["a@b.c"]. Map a scalar event field per element or a whole array.',
  }),
  cc: z.array(z.string().email()).optional().meta({
    description: "Carbon-copy addresses — JSON array of email strings.",
  }),
  bcc: z.array(z.string().email()).optional().meta({
    description: "Blind carbon-copy addresses — JSON array of email strings.",
  }),
  variables: z.record(z.string(), z.unknown()).optional().meta({
    description:
      "Template placeholder values — a nested map: each template variable maps to a source entry (const/path/meta/fallback). Suggested keys come from the selected template's `variables` declaration.",
    x_map_keys: { from: "templateCode", prop: "variables" },
  }),
  entityTable: z.string().optional().meta({
    description:
      "Table the email relates to (e.g. customers) — recorded on the sender_log row for traceability.",
    x_semantic: "entity.table",
    x_not_editable: true,
  }),
  entityId: z.bigint().optional().meta({
    description: "Numeric id of the related entity row (see entityTable).",
    x_semantic: "entity.id",
    x_not_editable: true,
  }),
  entityUuid: z.string().optional().meta({
    description: "Uuid of the related entity row (see entityTable).",
    x_semantic: "entity.uuid",
    x_not_editable: true,
  }),
  initiatedBy: z.string().optional().meta({
    description:
      "Audit metadata — the real session actor that triggered the send; recorded on sender_log. Explicit mapping only (e.g. `inject:session_actor`).",
    x_semantic: "actor.uuid",
    x_not_editable: true,
  }),
});

export type SendEmailRequest = z.infer<typeof SendEmailSchema>;

/** The census/FE/docs projection — `z.bigint()` emits as `integer` (the
 *  ext-json wire has no plain-number ints; every int decodes bigint). */
export const SEND_EMAIL_PAYLOAD_SCHEMA: Record<string, unknown> = z.toJSONSchema(
  SendEmailSchema,
  {
    unrepresentable: ({ zodSchema }) =>
      zodSchema._zod.def.type === "bigint" ? { type: "integer" } : "throw",
  },
);

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
