/**
 * Emitted-event self-declaration — persisted verbatim in
 * service_registry.endpoints.events and served on /modules (never
 * access-filtered: it is a domain vocabulary, not a route surface).
 *
 * The CRM module owns the customer domain, so its event vocabulary is
 * customer-shaped. Subjects follow the domain-event convention
 * `events.<svc>.<entity>.on.<name>` — the `.on.` marker keeps semantic
 * names out of the uuid slot, and the whole subtree stays under
 * `events.crm.customer.>` (one binding covers lifecycle + semantics).
 * Two layers by design:
 *
 *   events.crm.customer.on.changed    — FACT: a customer row changed
 *                                       (snapshot + change metadata).
 *                                       CRUD stays dumb: it says
 *                                       "something changed", nothing more.
 *   events.crm.customer.on.high_value — SEMANTIC: sales logic decided this
 *                                       customer crossed the high-value
 *                                       threshold. Rules hang off meaning,
 *                                       not off CRUD diffs — the "what
 *                                       counts as high value" business
 *                                       rule lives here once, not inside
 *                                       every rule's filter expression.
 *   events.crm.customer.on.payout     — SEMANTIC: a payout was recorded
 *                                       for the customer.
 *
 * Every emit carries a `payload_schema` — that is what lets the rule
 * form's payload_map offer real `$.` path suggestions (the event payload
 * IS what the rule receives). The semantic events also carry an
 * `account_manager` block so a rule can map the notification recipient
 * (`to`) straight from the event.
 *
 * Authoring: schemas are ZOD-derived (`z.toJSONSchema`) — the same path
 * callable payload contracts take, so `format`/`x_semantic` annotations are
 * generated from real validators instead of hand-written literals (the
 * `changed_at: type:"string"` drift this closes). `payload_schema` is a
 * DESCRIPTIVE contract — event payloads are not parsed against it.
 *
 * PoC note: there is no real sales pipeline emitting these yet — the
 * `crm.emit_fake_event` callable (controllers/nats-sub/fake-event-emitter.ts)
 * publishes canned/overridable payloads on these exact subjects so the
 * rule pipeline can be exercised end-to-end.
 */
import { z } from "zod";
import { LANG_RE, type ModuleEventsDecl } from "@primebrick/sdk";

/** The customer projection every CRM event embeds — mirrors
 *  `CustomerEntity`'s public fields PLUS the canonical children resolved
 *  at emit time. `email`/`phone` are DERIVED from the default
 *  EMAIL/VOICE `customer_contacts` rows (the paths `$.entity.after.email` /
 *  `$.entity.after.phone` keep working — rules never chase the sub-array);
 *  `legal_address`/`account` come from the legal `local_addresses` row
 *  and the legal `customer_accounts` datasheet. */
const LEGAL_ADDRESS_SNAPSHOT = z.object({
  street: z.string().meta({ description: "Street line 1 (civic included)." }),
  street2: z.string().optional().meta({ description: "Street line 2." }),
  postal_code: z.string(),
  city: z.string(),
  province: z.string().optional(),
  country: z.string().length(2).meta({ description: "ISO 3166-1 alpha-2." }),
});
const ACCOUNT_SNAPSHOT = z.object({
  company_name: z.string().meta({ description: "Registered fiscal name." }),
  country: z.string().length(2).meta({ description: "Fiscal jurisdiction, ISO alpha-2." }),
  legal_form_uuid: z.string().uuid().optional(),
});
const CUSTOMER_SNAPSHOT = z.object({
  uuid: z.string().uuid().meta({ description: "Customer row uuid." }),
  code: z.string().min(1).meta({ description: "Human customer code (unique)." }),
  display_name: z.string().optional().meta({ description: "Informal display name (pseudonym allowed)." }),
  customer_type_uuid: z.string().uuid().optional(),
  qualification_uuid: z.string().uuid().optional(),
  marketing_qualification_uuid: z.string().uuid().optional(),
  company_dimension_uuid: z.string().uuid().optional(),
  email: z.string().email().optional().meta({
    description: "DERIVED — default EMAIL customer_contacts value.",
  }),
  phone: z.string().meta({ format: "phone" }).optional().meta({
    description: "DERIVED — default VOICE customer_contacts value.",
  }),
  status: z
    .enum(["ACTIVE", "INACTIVE"])
    .meta({ description: "Customer lifecycle status (CustomerEntity.status)." })
    .optional(),
  status_reason: z.string().optional(),
  legal_address: LEGAL_ADDRESS_SNAPSHOT.optional().meta({
    description: "DERIVED — the customer's legal local_addresses row.",
  }),
  account: ACCOUNT_SNAPSHOT.optional().meta({
    description: "DERIVED — the customer's legal customer_accounts datasheet.",
  }),
  preferred_locale: z.string().regex(LANG_RE).meta({
    format: "lang",
    description: "Customer's preferred locale — BCP-47 (e.g. it-IT). Map `languageIso` from here.",
  }).optional(),
});
const CUSTOMER_SNAPSHOT_SCHEMA = z.toJSONSchema(CUSTOMER_SNAPSHOT);

/** The shared event envelope (wire `schema:2`) — who/what/when/where on
 *  every domain event. `emitted_by` is an actor TOKEN (uuid OR
 *  `system:<code>`), so `actor_token` is the honest format. */
const EVENT_ENVELOPE = z.object({
  schema: z.literal(2),
  service: z.string(),
  subject: z.string().meta({ description: "The NATS subject this event was published on — self-describing." }),
  emitted_at: z.iso.datetime().meta({ description: "RFC 3339 timestamp of the emission." }),
  emitted_by: z.string().meta({
    format: "actor_token",
    description: "Actor token — user uuid or `system:<code>`.",
  }),
  action: z.string().meta({ description: "Event verb — the semantic name for `on.*` subjects." }),
  entity: z.string().optional().meta({ description: "API entity name the event is about." }),
  uuid: z.string().uuid().optional().meta({ description: "Row uuid the event is about." }),
  version: z.number().int().optional().meta({ description: "Row version after the write." }),
  batch: z.string().optional().meta({ description: "Shared id correlating a multi-row op." }),
});
const ENTITY_SECTION = z.object({
  after: CUSTOMER_SNAPSHOT.meta({
    description: "Current customer state — the snapshot this event reports.",
  }),
});

const CUSTOMER_CHANGED = z.object({
  event: EVENT_ENVELOPE.meta({ x_label_key: "app.entity_events.event" }),
  entity: ENTITY_SECTION.meta({ x_label_key: "app.entity_events.entity" }),
  change: z.object({
    kind: z
      .enum(["created", "updated", "deleted"])
      .meta({ description: "What happened to the row." }),
    changed_fields: z
      .array(z.string())
      .meta({ description: "Column names that changed (updates only)." })
      .optional(),
  }).meta({ x_label_key: "crm.events.fields.change" }),
});
const CUSTOMER_CHANGED_SCHEMA = z.toJSONSchema(CUSTOMER_CHANGED);

const ACCOUNT_MANAGER = z.object({
  uuid: z.string().uuid(),
  email: z.string().email().meta({
    description: "Notification recipient for rule targets — map `to` from here.",
  }),
  display_name: z.string().optional(),
});
const ACCOUNT_MANAGER_SCHEMA = z.toJSONSchema(ACCOUNT_MANAGER);

const CUSTOMER_HIGH_VALUE = z.object({
  event: EVENT_ENVELOPE.meta({ x_label_key: "app.entity_events.event" }),
  entity: ENTITY_SECTION.meta({ x_label_key: "app.entity_events.entity" }),
  account_manager: ACCOUNT_MANAGER.optional().meta({ x_label_key: "crm.events.fields.account_manager" }),
  trigger: z.object({
    metric: z
      .enum(["annual_revenue", "deal_amount", "orders_count"])
      .meta({ description: "Which measure crossed the threshold." }),
    amount: z.number().meta({ description: "Observed value that crossed." }),
    currency: z.string().meta({ description: "ISO 4217 (EUR, USD…)." }).optional(),
    threshold: z.number().meta({ description: "Configured high-value threshold that was crossed." }),
  }).meta({ x_label_key: "crm.events.fields.trigger" }),
});
const CUSTOMER_HIGH_VALUE_SCHEMA = z.toJSONSchema(CUSTOMER_HIGH_VALUE);

const CUSTOMER_PAYOUT = z.object({
  event: EVENT_ENVELOPE.meta({ x_label_key: "app.entity_events.event" }),
  entity: ENTITY_SECTION.meta({ x_label_key: "app.entity_events.entity" }),
  account_manager: ACCOUNT_MANAGER.optional().meta({ x_label_key: "crm.events.fields.account_manager" }),
  payout: z.object({
    amount: z.number().meta({ description: "Payout amount." }),
    currency: z.enum(["EUR", "USD", "GBP"]).meta({ description: "ISO 4217 payout currency." }),
    period: z.string().meta({ description: "Settlement period (e.g. 2026-Q1)." }).optional(),
    due_at: z
      .iso.datetime()
      .meta({ description: "ISO 8601 payment due date." })
      .optional(),
    reference: z.string().meta({ description: "External payout reference." }).optional(),
  }).meta({ x_label_key: "crm.events.fields.payout" }),
});
const CUSTOMER_PAYOUT_SCHEMA = z.toJSONSchema(CUSTOMER_PAYOUT);

export const CRM_EVENTS: ModuleEventsDecl = {
  emits: [
    {
      subject: "events.crm.customer.on.changed",
      label_key: "crm.events.customer_changed.label",
      description_key: "crm.events.customer_changed.desc",
      payload_schema: CUSTOMER_CHANGED_SCHEMA,
      entity: { key: "customer", entity: "customer", table: "customers" },
    },
    {
      subject: "events.crm.customer.on.high_value",
      label_key: "crm.events.customer_high_value.label",
      description_key: "crm.events.customer_high_value.desc",
      payload_schema: CUSTOMER_HIGH_VALUE_SCHEMA,
      entity: { key: "customer", entity: "customer", table: "customers" },
    },
    {
      subject: "events.crm.customer.on.payout",
      label_key: "crm.events.customer_payout.label",
      description_key: "crm.events.customer_payout.desc",
      payload_schema: CUSTOMER_PAYOUT_SCHEMA,
      entity: { key: "customer", entity: "customer", table: "customers" },
    },
  ],
};
