import { NatsClient, makeNatsRoutes, Permission, logger } from "@primebrick/sdk";
import type { SendEmailRequest, SendEmailResponse } from "./types.js";

const EMAIL_SEND_SUBJECT = "emailsender.send";
const EMAIL_RESPONSE_SUBJECT = "emailsender.response";

/**
 * SendEmailRequest payload contract — declaring it lists this route in
 * `endpoints.callables` (schedulers/rules pick it from the census). The
 * schema mirrors `SendEmailRequest` 1:1; keep them in lockstep.
 */
const SEND_EMAIL_REQUEST_SCHEMA = {
  type: "object",
  required: ["requestId", "templateCode", "languageIso", "to"],
  properties: {
    requestId: {
      type: "string",
      description:
        "Unique id for this send — echoed back on emailsender.response.<requestId>. Generated per-dispatch via the `uuid` injector — platform-owned, never caller-authored.",
      x_inject: "uuid",
      x_not_editable: true,
    },
    templateCode: {
      type: "string",
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
    },
    languageIso: {
      type: "string",
      description: "The email language — picks which language variant of the template is sent to the recipient (e.g. it-IT, en-US). Uses the standard BCP-47 locale format.",
      x_options: { values_source: "locales" },
    },
    to: {
      type: "array",
      items: { type: "string" },
      description: "Recipient addresses — a JSON array, e.g. [\"a@b.c\"]. Map a scalar event field per element or a whole array.",
    },
    cc: {
      type: "array",
      items: { type: "string" },
      description: "Carbon-copy addresses — JSON array of email strings.",
    },
    bcc: {
      type: "array",
      items: { type: "string" },
      description: "Blind carbon-copy addresses — JSON array of email strings.",
    },
    variables: {
      type: "object",
      description:
        "Template placeholder values — a nested map: each template variable maps to a source entry (const/path/meta/fallback). Suggested keys come from the selected template's `variables` declaration.",
      x_map_keys: { from: "templateCode", prop: "variables" },
    },
    entityTable: {
      type: "string",
      description:
        "Table the email relates to (e.g. customers) — recorded on the sender_log row for traceability.",
      x_semantic: "entity.table",
      x_not_editable: true,
    },
    entityId: {
      type: "integer",
      description: "Numeric id of the related entity row (see entityTable).",
      x_semantic: "entity.id",
      x_not_editable: true,
    },
    entityUuid: {
      type: "string",
      description: "Uuid of the related entity row (see entityTable).",
      x_semantic: "entity.uuid",
      x_not_editable: true,
    },
    initiatedBy: {
      type: "string",
      description:
        "Audit metadata — the real session actor that triggered the send; recorded on sender_log. Explicit mapping only (e.g. `inject:session_actor`).",
      x_semantic: "actor.uuid",
      x_not_editable: true,
    },
  },
} as const;

/**
 * Inbound email work item. Two-layer inbound model enforced by the SDK
 * factory: FIRST the publisher's client shield (UA+key vs client_shield_registry —
 * "BE may talk to emailsender"), THEN the user layer ("is this actor allowed
 * to send email"): gateway secret + AuthUser + RBAC EMAILSENDER_SEND.
 * A valid shield with missing/insufficient user context is denied — service
 * identity never authorizes a user-context operation.
 */
export async function subscribeToEmailSendRequests(
  handleSendEmail: (request: SendEmailRequest, actorId?: string) => Promise<SendEmailResponse>,
): Promise<void> {
  logger.info(`Subscribed to ${EMAIL_SEND_SUBJECT}`, { tags: ["nats-sub"] });

  await makeNatsRoutes(
    [
      {
        subject: EMAIL_SEND_SUBJECT,
        // Work item: exactly one emailsender replica processes each request.
        queue: "emailsender",
        permissions: [Permission.EMAILSENDER_SEND],
        payload_schema: SEND_EMAIL_REQUEST_SCHEMA,
        label_key: "emailsender.callable.send.label",
        description_key: "emailsender.callable.send.desc",
        handler: async ({ request }) => {
          const req = request as SendEmailRequest;
          logger.debug(`Received email send request: ${req.requestId}`, { tags: ["nats-sub"] });
          const response = await handleSendEmail(req, req.initiatedBy);
          await NatsClient.publish(`${EMAIL_RESPONSE_SUBJECT}.${req.requestId}`, response);
          logger.debug(
            `Processed email send request: ${req.requestId} - ${response.success ? "SUCCESS" : "FAILED"}`,
            { tags: ["nats-sub"] },
          );
        },
      },
    ],
    { serviceCode: "emailsender" },
  );
}
