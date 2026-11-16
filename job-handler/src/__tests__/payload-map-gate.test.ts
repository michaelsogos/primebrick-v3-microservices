/**
 * Wire gate for `job_trigger` writes — `assertEmitSubject` +
 * `assertPayloadMapConformance`.
 *
 * `assertEmitSubject` proves `event_subject` resolves to a declared emit
 * (wildcard patterns cover the concrete subjects they span).
 *
 * `assertPayloadMapConformance` proves the MERGED map conforms to the
 * callable's emitted schema — and, on an absent/empty map (verbatim
 * passthrough: `applyPayloadMap` returns the event payload unchanged,
 * schedule-only fires dispatch `{}`), that every required destination
 * prop is deliverable: `x_inject`/`x_semantic`-materialized or provably
 * present in the source emit's declared schema. `x_map_keys` declarations
 * resolve through `resolveMapKeySchemas` (mocked here — its own contract
 * is a governed fetch, covered by the fail-open branches below).
 */
import "reflect-metadata";
import { describe, expect, it, vi } from "vitest";

vi.mock("@primebrick/sdk", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@primebrick/sdk")>()),
  NatsClient: { jetstreamPublish: vi.fn(async () => {}) },
  makeMarkerAuditPort: () => ({}),
  logger: { done: () => {}, warn: () => {}, info: () => {}, error: () => {}, debug: () => {} },
}));
vi.mock("../db/dal.js", () => ({
  getDal: () => ({ entityService: () => ({}), tableAuditPort: () => ({}) }),
}));
vi.mock("../db/entity-repo.js", () => ({ entityActor: {} }));

const CALLABLE_SCHEMA: Record<string, unknown> = {
  type: "object",
  required: ["to", "templateCode", "languageIso"],
  properties: {
    to: { type: "array", items: { type: "string", format: "email" } },
    templateCode: {
      type: "string",
      x_options: { api_url: "/svc/emailsender/api/v1/entities/email_template/list", value_field: "code" },
    },
    languageIso: { type: "string" },
    variables: { type: "object", x_map_keys: { from: "templateCode", prop: "variables" } },
    requestId: { type: "string", x_semantic: "request.id" },
  },
};

/** Emit declaring all the callable's requireds — passthrough is provably
 *  covered. `customer` rides along as the domain-entity snapshot. */
const COVERING_EMIT_SCHEMA: Record<string, unknown> = {
  type: "object",
  required: ["to", "templateCode", "languageIso", "customer"],
  properties: {
    to: { type: "array", items: { type: "string", format: "email" } },
    templateCode: { type: "string" },
    languageIso: { type: "string" },
    customer: { type: "object" },
  },
};

/** Emit that does NOT carry the callable's requireds — the real-world
 *  `e2e.draft.fired` shape that let `e2e-draft-detail` sail through. */
const UNCOVERING_EMIT_SCHEMA: Record<string, unknown> = {
  type: "object",
  required: ["requestId", "initiatedBy"],
  properties: { requestId: { type: "string" }, initiatedBy: { type: "string" } },
};

const EMITS = new Map<string, Record<string, unknown> | undefined>([
  ["crm.customer_changed", COVERING_EMIT_SCHEMA],
  ["e2e.draft.fired", UNCOVERING_EMIT_SCHEMA],
  ["emailsender.response.*", undefined], // schema-less wildcard emit
]);

const emitDeclForMock = vi.fn(async (s: string) => EMITS.get(s) !== undefined || EMITS.has(s)
  ? { subject: s, schema: EMITS.get(s) }
  : undefined);
const resolveMapKeySchemasMock = vi.fn(
  async (): Promise<Record<string, Record<string, { schema: Record<string, unknown>; required: boolean }>> | undefined> =>
    undefined,
);

vi.mock("../services/callable-catalog.js", async (importOriginal) => {
  const orig = await importOriginal<typeof import("../services/callable-catalog.js")>();
  return {
    ...orig,
    callableSubjects: async () => new Set(["emailsender.send"]),
    callablePayloadSchema: async () => CALLABLE_SCHEMA,
    emitSubjects: async () => new Set(EMITS.keys()),
    emitDeclFor: emitDeclForMock,
  };
});
vi.mock("../services/map-key-schemas.js", () => ({
  resolveMapKeySchemas: resolveMapKeySchemasMock,
}));

const { assertEmitSubject, assertPayloadMapConformance } = await import("../modules/jobs/jobs.service.js");


describe("assertEmitSubject", () => {
  it("rejects an event nobody declares", async () => {
    await expect(
      assertEmitSubject({ event_subject: "ghost.never_emitted" }),
    ).rejects.toThrow(/not a declared emit/);
  });

  it("accepts an exactly-declared emit", async () => {
    await expect(assertEmitSubject({ event_subject: "crm.customer_changed" })).resolves.toBeUndefined();
  });

  it("accepts a concrete subject covered by a wildcard emit", async () => {
    await expect(assertEmitSubject({ event_subject: "emailsender.response.delivered" })).resolves.toBeUndefined();
  });

  it("rejects a wildcard trigger under a narrower/concrete emit", async () => {
    await expect(assertEmitSubject({ event_subject: "crm.*" })).rejects.toThrow(/not a declared emit/);
  });

  it("skips an absent event_subject (shape rule owns presence)", async () => {
    await expect(assertEmitSubject({})).resolves.toBeUndefined();
  });
});

describe("assertPayloadMapConformance — empty map (passthrough)", () => {
  it("schedule-only + required callable → rejected (fire dispatches {})", async () => {
    await expect(
      assertPayloadMapConformance({
        target_subject: "emailsender.send",
        schedule_spec: "@every 1d",
        payload_map: null,
      }),
    ).rejects.toThrow(/unmapped_required/);
  });

  it("event-gated + emit provably carrying the requireds → passes", async () => {
    await expect(
      assertPayloadMapConformance({
        target_subject: "emailsender.send",
        event_subject: "crm.customer_changed",
        payload_map: {},
      }),
    ).resolves.toBeUndefined();
  });

  it("event-gated + emit NOT carrying the requireds → rejected", async () => {
    await expect(
      assertPayloadMapConformance({
        target_subject: "emailsender.send",
        event_subject: "e2e.draft.fired",
      }),
    ).rejects.toThrow(/payload_map\.(to|templateCode|languageIso).*unmapped_required/);
  });

  it("event-gated + schema-less emit → rejected (supply not demonstrable)", async () => {
    await expect(
      assertPayloadMapConformance({
        target_subject: "emailsender.send",
        event_subject: "emailsender.response.delivered",
        payload_map: null,
      }),
    ).rejects.toThrow(/unmapped_required/);
  });

  it("PATCH merged — stored empty map re-validates when the write carries target/map", async () => {
    const loadExisting = async () => ({
      target_subject: "emailsender.send",
      event_subject: "e2e.draft.fired",
      payload_map: null,
    });
    await expect(assertPayloadMapConformance({ payload_map: {} }, loadExisting)).rejects.toThrow(
      /unmapped_required/,
    );
  });
});

describe("assertPayloadMapConformance — non-empty map", () => {
  const fullMap = {
    to: { kind: "const", value: "user@example.com" },
    templateCode: { kind: "const", value: "welcome" },
    languageIso: { kind: "const", value: "it-IT" },
    variables: { kind: "map", entries: { otp_code: { kind: "const", value: "123456" } } },
  };

  it("all required mapped + declared sub-keys present → passes", async () => {
    resolveMapKeySchemasMock.mockResolvedValueOnce({
      variables: { otp_code: { schema: { type: "string" }, required: true } },
    });
    await expect(
      assertPayloadMapConformance({ target_subject: "emailsender.send", payload_map: fullMap }),
    ).resolves.toBeUndefined();
  });

  it("declared-required `x_map_keys` key missing from the map → rejected", async () => {
    resolveMapKeySchemasMock.mockResolvedValueOnce({
      variables: {
        otp_code: { schema: { type: "string" }, required: true },
        tenant_name: { schema: { type: "string" }, required: true },
      },
    });
    await expect(
      assertPayloadMapConformance({ target_subject: "emailsender.send", payload_map: fullMap }),
    ).rejects.toThrow(/variables\.tenant_name.*unmapped_required/);
  });

  it("declared OPTIONAL key absent → passes", async () => {
    resolveMapKeySchemasMock.mockResolvedValueOnce({
      variables: {
        otp_code: { schema: { type: "string" }, required: true },
        footer_note: { schema: { type: "string" }, required: false },
      },
    });
    await expect(
      assertPayloadMapConformance({ target_subject: "emailsender.send", payload_map: fullMap }),
    ).resolves.toBeUndefined();
  });

  it("resolver fail-open (undefined) → base map check stands alone", async () => {
    // resolveMapKeySchemasMock default: undefined — the base requireds are
    // still enforced; `variables` simply goes unproven like before.
    await expect(
      assertPayloadMapConformance({ target_subject: "emailsender.send", payload_map: fullMap }),
    ).resolves.toBeUndefined();
    await expect(
      assertPayloadMapConformance({
        target_subject: "emailsender.send",
        payload_map: { templateCode: { kind: "const", value: "welcome" } },
      }),
    ).rejects.toThrow(/unmapped_required/);
  });
});
