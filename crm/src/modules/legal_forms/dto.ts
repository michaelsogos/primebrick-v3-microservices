import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { LEGAL_FORM_SORT_KEYS } from "./legal_form.meta.js";

export const LegalFormListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(LEGAL_FORM_SORT_KEYS as [string, ...string[]]).optional(),
});

const LegalFormBaseSchema = z.object({
  code: z.string().min(1).max(50),
  /** ISO 3166-1 alpha-2 — cascade pivot for `legal_form_uuid` pickers. */
  country: z.string().length(2),
  /** ISO 20275 ELF code (e.g. "6JYP" for IT SRL). */
  elf_code: z.string().length(4),
  name_local: z.string().min(1),
  name_transliterated: z.string().min(1).optional(),
  abbreviation: z.string().min(1).max(50).optional(),
  /** GLEIF vocabulary: ACTV (active) | INAC (inactive). */
  status: z.enum(["ACTV", "INAC"]).default("ACTV"),
  sort: z.coerce.number().int().min(0).default(0),
});

export const LegalFormCreateBodySchema = LegalFormBaseSchema;
export const LegalFormUpdateBodySchema = zPartialNoDefaults(
  LegalFormBaseSchema.omit({ code: true }).extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }).strict(),
);

export const LegalFormAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
