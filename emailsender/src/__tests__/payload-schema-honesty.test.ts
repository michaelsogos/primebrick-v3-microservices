import { describe, expect, it } from "vitest";
import { pathCompatible, schemaHonestyIssue, walkSchemaProps } from "@primebrick/sdk";

import { SEND_EMAIL_PAYLOAD_SCHEMA } from "../controllers/nats-sub/types.js";

/**
 * Empirical honesty proof for the service's declared callable contract —
 * the REAL projected JSON schema (`z.toJSONSchema(SendEmailSchema)`) is
 * walked property-by-property against the shared matrix, so a dishonest
 * name/format drift fails `pnpm test` AND the enrollment gate alike.
 */
describe("emailsender.send payload_schema", () => {
  it("every declared prop is name-vs-format honest (empirical, recursive)", () => {
    for (const { field, path, prop } of walkSchemaProps(SEND_EMAIL_PAYLOAD_SCHEMA)) {
      expect(schemaHonestyIssue(field, prop), path).toBeNull();
    }
  });

  it("languageIso declares format:\"lang\" — only locale-shaped sources are mappable", () => {
    const target = SEND_EMAIL_PAYLOAD_SCHEMA["properties"] as Record<string, any>;
    const languageIso = target.languageIso;
    expect(languageIso.format).toBe("lang");
    // The ONE honest pairing — a declared BCP-47 source.
    expect(pathCompatible(languageIso, { type: "string", format: "lang" })).toBe(true);
    // Everything else is screened out — level 1 (type) or level 2 (format).
    for (const source of [
      { type: "string" },
      { type: "string", format: "uuid" },
      { type: "string", format: "email" },
      { type: "array", items: { type: "string" } },
      { type: "number" },
      target.requestId,
      target.to,
      target.entityUuid,
    ]) {
      expect(pathCompatible(languageIso, source as Record<string, unknown>)).toBe(false);
    }
  });

  it("to accepts only email-shaped string sources, per element", () => {
    const to = (SEND_EMAIL_PAYLOAD_SCHEMA["properties"] as Record<string, any>).to;
    expect(pathCompatible(to, { type: "array", items: { type: "string", format: "email" } })).toBe(true);
    expect(pathCompatible(to, { type: "array", items: { type: "string" } })).toBe(false);
    expect(pathCompatible(to, { type: "string", format: "email" })).toBe(false);
  });
});
