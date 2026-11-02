/**
 * PoC fake-event emitter — `crm.emit_fake_event`, a governed `request`
 * callable that republishes a canned (optionally overridden) payload on
 * one of the CRM's DECLARED event subjects.
 *
 * Why a callable and not a timer: PoC scenarios need controlled "different
 * fake cases" on demand — the caller picks the subject and patches the
 * payload via `overrides`. And why it's in the census: it IS a real
 * governed route, so its payload_schema legitimately lists it — a rule can
 * even chain onto it (rule → emit_fake_event → event → another rule).
 *
 * Auth forwarding: the republished event carries the CALLER's auth headers
 * verbatim (`forwardAuthHeaders`) — the same contract the rules engine
 * relies on to arm user-lane schedules. A fake event emitted by an
 * authenticated user can therefore arm user-lane rules; the enum keeps the
 * subject closed to this module's own declared events (no impersonating
 * `service.register` or foreign subjects).
 *
 * Temporary by design: once real sales logic emits these subjects, this
 * route is deleted with it — nothing else depends on it.
 */
import {
  makeNatsRequestRoute,
  NatsClient,
  Permission,
  logger,
  forwardAuthHeaders,
} from "@primebrick/sdk";

const EMIT_FAKE_SUBJECT = "crm.emit_fake_event";

/** Closed subject vocabulary — only this module's declared emits. */
const FAKEABLE_EVENTS = [
  "crm.customer_changed",
  "crm.customer_high_value",
  "crm.customer_payout",
] as const;
type FakeableEvent = (typeof FAKEABLE_EVENTS)[number];

interface EmitFakeEventRequest {
  event: FakeableEvent;
  /** Top-level merge over the canned fake — e.g.
   *  `{customer: {email: "x@y.z"}}` swaps just that field. */
  overrides?: Record<string, unknown>;
}

const EMIT_FAKE_REQUEST_SCHEMA = {
  type: "object",
  required: ["event"],
  properties: {
    event: {
      type: "string",
      enum: [...FAKEABLE_EVENTS],
      description: "Declared CRM event subject to publish.",
    },
    overrides: {
      type: "object",
      description:
        "Shallow-merged over the canned fake payload, per top-level key — swap any field (e.g. customer.email) without rebuilding the whole document.",
    },
  },
} as const;

const FAKE_CUSTOMER = {
  uuid: "11111111-2222-3333-4444-555555555555",
  code: "FAKE-001",
  first_name: "Mario",
  last_name: "Rossi",
  company_name: "Acme S.p.A.",
  email: "mario.rossi@acme.example",
  phone: "+39 02 0000000",
  status: "ACTIVE",
  local_address: "Via Roma 1",
  local_city: "Milano",
  local_state: "MI",
  local_country: "IT",
  local_zip: "20100",
  preferred_locale: "it-IT",
} as const;

const FAKE_ACCOUNT_MANAGER = {
  uuid: "9e358bc6-e336-4c1d-b4c2-a7a415f5a57c",
  email: "e2e_verify_admin@e2e.local",
  display_name: "E2E Verify Admin",
} as const;

function cannedPayload(event: FakeableEvent): Record<string, unknown> {
  const now = new Date().toISOString();
  switch (event) {
    case "crm.customer_changed":
      return {
        customer: { ...FAKE_CUSTOMER },
        change: {
          kind: "updated",
          changed_fields: ["status"],
          changed_by: FAKE_ACCOUNT_MANAGER.uuid,
          changed_at: now,
        },
      };
    case "crm.customer_high_value":
      return {
        customer: { ...FAKE_CUSTOMER },
        account_manager: { ...FAKE_ACCOUNT_MANAGER },
        trigger: {
          metric: "annual_revenue",
          amount: 125000,
          currency: "EUR",
          threshold: 100000,
        },
      };
    case "crm.customer_payout":
      return {
        customer: { ...FAKE_CUSTOMER },
        account_manager: { ...FAKE_ACCOUNT_MANAGER },
        payout: {
          amount: 4200,
          currency: "EUR",
          period: "2026-Q1",
          due_at: now.slice(0, 10),
          reference: "PO-FAKE-001",
        },
      };
  }
}

/** Shallow-merge overrides per top-level key — objects merge field-wise,
 *  everything else is replaced. */
function applyOverrides(
  base: Record<string, unknown>,
  overrides: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, v] of Object.entries(overrides ?? {})) {
    const cur = out[key];
    if (
      v !== null &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      cur !== null &&
      typeof cur === "object" &&
      !Array.isArray(cur)
    ) {
      out[key] = { ...(cur as Record<string, unknown>), ...(v as Record<string, unknown>) };
    } else {
      out[key] = v;
    }
  }
  return out;
}

export async function subscribeFakeEventEmitter(): Promise<void> {
  logger.info(`Subscribed to ${EMIT_FAKE_SUBJECT}`, { tags: ["nats-sub"] });
  await makeNatsRequestRoute<EmitFakeEventRequest, { published: string; payload: unknown }>(
    [
      {
        subject: EMIT_FAKE_SUBJECT,
        // PoC/dev harness — gated on customer-create: who may create a
        // customer may also fake a customer event.
        permissions: [Permission.CUSTOMER_CREATE_SINGLE],
        payload_schema: EMIT_FAKE_REQUEST_SCHEMA,
        label_key: "crm.callable.emit_fake_event.label",
        description_key: "crm.callable.emit_fake_event.desc",
        validate: (raw): EmitFakeEventRequest => {
          const req = raw as EmitFakeEventRequest;
          if (!req || !FAKEABLE_EVENTS.includes(req.event)) {
            throw new Error(
              `event must be one of: ${FAKEABLE_EVENTS.join(", ")}`,
            );
          }
          return req;
        },
        handler: async ({ request, msg }) => {
          const payload = applyOverrides(cannedPayload(request.event), request.overrides);
          // Verbatim auth forwarding — user-lane rules arm on this event
          // only while the caller's context rides along.
          await NatsClient.publish(request.event, payload, forwardAuthHeaders(msg));
          return { published: request.event, payload };
        },
      },
    ],
    { serviceCode: "crm" },
  );
}
