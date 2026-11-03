import { describe, expect, it } from "vitest";
import {
  pathCompatible,
  schemaHonestyIssue,
  validateEventsDeclaration,
  walkSchemaProps,
} from "@primebrick/sdk";

import { CRM_EVENTS } from "../events-declaration.js";

/**
 * Write-time gate: the service's emitted-event declaration must pass the
 * SAME deep validator the BE applies at enrollment (x_* vocabulary +
 * name-vs-format honesty, recursive) — a dishonest schema fails `pnpm test`
 * here long before registration rejects it. This is the empirical proof
 * that the `changed_at: type:"string"` drift class can never reach the
 * registry again: every REAL declared schema is walked, not parsed at the
 * source-text level.
 */
describe("CRM_EVENTS declaration", () => {
  it("passes the shared deep enrollment validator", () => {
    expect(validateEventsDeclaration("crm", CRM_EVENTS)).toBeNull();
  });

  it("every declared prop is name-vs-format honest (empirical, recursive)", () => {
    for (const emit of CRM_EVENTS.emits ?? []) {
      const schema = emit.payload_schema as Record<string, unknown>;
      for (const { field, path, prop } of walkSchemaProps(schema)) {
        expect(
          schemaHonestyIssue(field, prop),
          `${emit.subject} → ${path}`,
        ).toBeNull();
      }
    }
  });

  it("a bare `type:\"string\"` on a semantic name is rejected at the gate", () => {
    const dishonest = {
      emits: [
        {
          subject: "crm.test_dishonest",
          payload_schema: {
            type: "object",
            properties: {
              changed_at: { type: "string" },
              customer: {
                type: "object",
                properties: { email: { type: "string" } },
              },
            },
          },
        },
      ],
    };
    expect(validateEventsDeclaration("crm", dishonest)).toMatch(/changed_at.*date-time/);
  });

  it("preferred_locale carries the lang contract — languageIso-class targets pair with it alone", () => {
    const schema = CRM_EVENTS.emits!.find((e) => e.subject === "crm.customer_changed")!
      .payload_schema as Record<string, any>;
    const locale = schema.properties.customer.properties.preferred_locale;
    expect(locale.format).toBe("lang");
    const languageIso = { type: "string", format: "lang" };
    expect(pathCompatible(languageIso, locale)).toBe(true);
    // No bare-string/array/uuid source satisfies a lang target.
    for (const source of [
      { type: "string" },
      { type: "string", format: "uuid" },
      { type: "array", items: { type: "string" } },
      schema.properties.customer.properties.first_name,
      schema.properties.change.properties.changed_fields,
      schema.properties.change.properties.changed_by,
    ]) {
      expect(pathCompatible(languageIso, source as Record<string, unknown>)).toBe(false);
    }
  });

  it("changed_by carries actor semantics — audit-shaped targets pair honestly", () => {
    const schema = CRM_EVENTS.emits!.find((e) => e.subject === "crm.customer_changed")!
      .payload_schema as Record<string, any>;
    const changedBy = schema.properties.change.properties.changed_by;
    expect(changedBy.x_semantic).toBe("actor.uuid");
    expect(pathCompatible({ type: "string", format: "uuid" }, changedBy)).toBe(true);
    expect(pathCompatible({ type: "string", x_semantic: "actor.uuid" }, changedBy)).toBe(true);
  });
});
