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
 * PoC note: there is no real sales pipeline emitting these yet — the
 * `crm.emit_fake_event` callable (controllers/nats-sub/fake-event-emitter.ts)
 * publishes canned/overridable payloads on these exact subjects so the
 * rule pipeline can be exercised end-to-end.
 */
import type { ModuleEventsDecl } from "@primebrick/sdk";

/** The customer row projection every CRM event embeds — mirrors
 *  `CustomerEntity`'s public fields (snake_case, no DTO renaming). */
const CUSTOMER_SNAPSHOT_SCHEMA = {
  type: "object",
  required: ["uuid", "code"],
  properties: {
    uuid: { type: "string", description: "Customer row uuid." },
    code: { type: "string", description: "Human customer code (unique)." },
    first_name: { type: "string" },
    last_name: { type: "string" },
    company_name: { type: "string" },
    email: { type: "string", description: "Customer contact address." },
    phone: { type: "string" },
    status: {
      type: "string",
      enum: ["ACTIVE", "INACTIVE"],
      description: "Customer lifecycle status (CustomerEntity.status).",
    },
    local_address: { type: "string" },
    local_city: { type: "string" },
    local_state: { type: "string" },
    local_country: { type: "string" },
    local_zip: { type: "string" },
    preferred_locale: {
      type: "string",
      description: "Customer's preferred locale — BCP-47 (e.g. it-IT). Map `languageIso` from here.",
    },
  },
} as const;

const CUSTOMER_CHANGED_SCHEMA = {
  type: "object",
  required: ["customer", "change"],
  properties: {
    customer: CUSTOMER_SNAPSHOT_SCHEMA,
    change: {
      type: "object",
      required: ["kind"],
      properties: {
        kind: {
          type: "string",
          enum: ["created", "updated", "deleted"],
          description: "What happened to the row.",
        },
        changed_fields: {
          type: "array",
          items: { type: "string" },
          description: "Column names that changed (updates only).",
        },
        changed_by: {
          type: "string",
          description: "Actor uuid that performed the write.",
        },
        changed_at: {
          type: "string",
          description: "ISO 8601 instant of the write.",
        },
      },
    },
  },
} as const;

const ACCOUNT_MANAGER_SCHEMA = {
  type: "object",
  properties: {
    uuid: { type: "string" },
    email: {
      type: "string",
      description:
        "Notification recipient for rule targets — map `to` from here.",
    },
    display_name: { type: "string" },
  },
} as const;

const CUSTOMER_HIGH_VALUE_SCHEMA = {
  type: "object",
  required: ["customer", "trigger"],
  properties: {
    customer: CUSTOMER_SNAPSHOT_SCHEMA,
    account_manager: ACCOUNT_MANAGER_SCHEMA,
    trigger: {
      type: "object",
      required: ["metric", "amount", "threshold"],
      properties: {
        metric: {
          type: "string",
          enum: ["annual_revenue", "deal_amount", "orders_count"],
          description: "Which measure crossed the threshold.",
        },
        amount: {
          type: "number",
          description: "Observed value that crossed.",
        },
        currency: { type: "string", description: "ISO 4217 (EUR, USD…)." },
        threshold: {
          type: "number",
          description: "Configured high-value threshold that was crossed.",
        },
      },
    },
  },
} as const;

const CUSTOMER_PAYOUT_SCHEMA = {
  type: "object",
  required: ["customer", "payout"],
  properties: {
    customer: CUSTOMER_SNAPSHOT_SCHEMA,
    account_manager: ACCOUNT_MANAGER_SCHEMA,
    payout: {
      type: "object",
      required: ["amount", "currency"],
      properties: {
        amount: { type: "number", description: "Payout amount." },
        currency: {
          type: "string",
          enum: ["EUR", "USD", "GBP"],
          description: "ISO 4217 payout currency.",
        },
        period: {
          type: "string",
          description: "Settlement period (e.g. 2026-Q1).",
        },
        due_at: {
          type: "string",
          description: "ISO 8601 payment due date.",
        },
        reference: { type: "string", description: "External payout reference." },
      },
    },
  },
} as const;

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
