/**
 * Domain contracts persisted as jsonb entity props.
 *
 * Each class is the runtime type of one entity column: the entity declares
 * `@Column({ jsType: <Class> })` and hydration revives the jsonb payload to
 * a real instance (prototype graft — `Object.assign(Object.create(
 * cls.prototype), v)`). Field vocabularies come from real write sites in
 * `email-service.ts` — nothing aspirational.
 */

/**
 * `sender_log.senders` — the envelope written when a send completes
 * (`{ from: config.from_email }`; `{}` when the send failed before a
 * provider accepted it).
 */
export class SenderEnvelope {
  from?: string;
}

/**
 * `sender_log.recipients` — the recipient set recorded on every send
 * (`{ to, cc?, bcc? }`; `{ to }` on early failures).
 */
export class RecipientEnvelope {
  to?: string[];
  cc?: string[];
  bcc?: string[];
}
