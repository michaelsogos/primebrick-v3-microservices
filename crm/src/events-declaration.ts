/**
 * Emitted-event self-declaration — persisted verbatim in
 * service_registry.endpoints.events and served on /modules (never
 * access-filtered: it is a domain vocabulary, not a route surface).
 *
 * The CRM module owns the customer domain, so its event vocabulary is
 * customer-shaped. Two layers by design:
 *
 *   crm.customer_changed    — FACT: a customer row changed (snapshot +
 *                             change metadata). CRUD stays dumb: it says
 *                             "something changed", nothing more.
 *   crm.customer_high_value — SEMANTIC: sales logic decided this customer
 *                             crossed the high-value threshold. Rules hang
 *                             off meaning, not off CRUD diffs — the
 *                             "what counts as high value" business rule
 *                             lives here once, not inside every rule's
 *                             filter expression.
 *   crm.customer_payout     — SEMANTIC: a payout was recorded for the
 *                             customer.
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

/** The customer row projection every CRM event embeds — mirrors
 *  `CustomerEntity`'s public fields (snake_case, no DTO renaming). */
const CUSTOMER_SNAPSHOT = z.object({
  uuid: z.string().uuid().meta({ description: "Customer row uuid." }),
  code: z.string().min(1).meta({ description: "Human customer code (unique)." }),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  email: z.string().email().optional().meta({ description: "Customer contact address." }),
  phone: z.string().meta({ format: "phone" }).optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE"])
    .meta({ description: "Customer lifecycle status (CustomerEntity.status)." })
    .optional(),
  local_address: z.string().optional(),
  local_city: z.string().optional(),
  local_state: z.string().optional(),
  local_country: z.string().optional(),
  local_zip: z.string().optional(),
  preferred_locale: z.string().regex(LANG_RE).meta({
    format: "lang",
    description: "Customer's preferred locale — BCP-47 (e.g. it-IT). Map `languageIso` from here.",
  }).optional(),
});
const CUSTOMER_SNAPSHOT_SCHEMA = z.toJSONSchema(CUSTOMER_SNAPSHOT);

const CUSTOMER_CHANGED = z.object({
  customer: CUSTOMER_SNAPSHOT,
  change: z.object({
    kind: z
      .enum(["created", "updated", "deleted"])
      .meta({ description: "What happened to the row." }),
    changed_fields: z
      .array(z.string())
      .meta({ description: "Column names that changed (updates only)." })
      .optional(),
    changed_by: z
      .string()
      .uuid()
      .meta({
        x_semantic: "actor.uuid",
        description: "Actor uuid that performed the write.",
      })
      .optional(),
    changed_at: z
      .iso.datetime()
      .meta({ description: "ISO 8601 instant of the write." })
      .optional(),
  }),
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
  customer: CUSTOMER_SNAPSHOT,
  account_manager: ACCOUNT_MANAGER.optional(),
  trigger: z.object({
    metric: z
      .enum(["annual_revenue", "deal_amount", "orders_count"])
      .meta({ description: "Which measure crossed the threshold." }),
    amount: z.number().meta({ description: "Observed value that crossed." }),
    currency: z.string().meta({ description: "ISO 4217 (EUR, USD…)." }).optional(),
    threshold: z.number().meta({ description: "Configured high-value threshold that was crossed." }),
  }),
});
const CUSTOMER_HIGH_VALUE_SCHEMA = z.toJSONSchema(CUSTOMER_HIGH_VALUE);

const CUSTOMER_PAYOUT = z.object({
  customer: CUSTOMER_SNAPSHOT,
  account_manager: ACCOUNT_MANAGER.optional(),
  payout: z.object({
    amount: z.number().meta({ description: "Payout amount." }),
    currency: z.enum(["EUR", "USD", "GBP"]).meta({ description: "ISO 4217 payout currency." }),
    period: z.string().meta({ description: "Settlement period (e.g. 2026-Q1)." }).optional(),
    due_at: z
      .iso.datetime()
      .meta({ description: "ISO 8601 payment due date." })
      .optional(),
    reference: z.string().meta({ description: "External payout reference." }).optional(),
  }),
});
const CUSTOMER_PAYOUT_SCHEMA = z.toJSONSchema(CUSTOMER_PAYOUT);

export const CRM_EVENTS: ModuleEventsDecl = {
  emits: [
    {
      subject: "crm.customer_changed",
      label_key: "crm.events.customer_changed.label",
      description_key: "crm.events.customer_changed.desc",
      payload_schema: CUSTOMER_CHANGED_SCHEMA,
      entity: { key: "customer", entity: "customer", table: "customers" },
    },
    {
      subject: "crm.customer_high_value",
      label_key: "crm.events.customer_high_value.label",
      description_key: "crm.events.customer_high_value.desc",
      payload_schema: CUSTOMER_HIGH_VALUE_SCHEMA,
      entity: { key: "customer", entity: "customer", table: "customers" },
    },
    {
      subject: "crm.customer_payout",
      label_key: "crm.events.customer_payout.label",
      description_key: "crm.events.customer_payout.desc",
      payload_schema: CUSTOMER_PAYOUT_SCHEMA,
      entity: { key: "customer", entity: "customer", table: "customers" },
    },
  ],
};
