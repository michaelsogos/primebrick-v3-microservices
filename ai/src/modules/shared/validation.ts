/**
 * Shared zod validation helpers for entity routes — ported from the BE's
 * `http/validation.ts` + `http/list-query.ts` (pure zod, no transport).
 *
 * `ListQueryBaseSchema` validates the canonical `/list` query contract:
 * filters arrive as QS bracket notation (`filters[0][field]=x`), parsed
 * into objects by the SDK's `parseBracketQuery` before this schema runs —
 * the same wire format Express `qs` produced on the BE. NO JSON-stringified
 * `filters=` anywhere.
 */
import { z } from "zod";

export function zBoundedInt(min: number, max: number) {
  return z
    .union([z.number(), z.bigint()])
    .transform((v) => (typeof v === "bigint" ? Number(v) : v))
    .pipe(z.number().int().min(min).max(max));
}

export function zBoundedNumber(min: number, max: number) {
  return z
    .union([z.number(), z.bigint()])
    .transform((v) => (typeof v === "bigint" ? Number(v) : v))
    .pipe(z.number().min(min).max(max));
}

export function zPartialNoDefaults<S extends z.ZodObject<z.ZodRawShape>>(
  schema: S,
): z.ZodType<{ [K in keyof z.output<S>]?: z.output<S>[K] }> {
  type Out = { [K in keyof z.output<S>]?: z.output<S>[K] };
  const partial = schema.partial();
  return z.unknown().transform((v, ctx) => {
    const r = partial.safeParse(v);
    if (!r.success) {
      for (const i of r.error.issues) ctx.addIssue(i as never);
      return z.NEVER;
    }
    const raw = v as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(r.data as Record<string, unknown>).filter(
        ([k]) => k in raw,
      ),
    ) as Out;
  });
}

// ─── List query schemas ──────────────────────────────────────────────────────

export const csvToStringArray = z
  .string()
  .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
  .pipe(z.array(z.string()));

/** `search_in` arrives either as bracket array (`search_in[]=a`) — already
 *  `string[]` — or as a legacy CSV scalar. Accept both. */
const searchInSchema = z.union([z.array(z.string()), csvToStringArray]);

const filterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.union([z.string(), z.number(), z.boolean()])),
  z.object({
    start: z.union([z.string(), z.number()]),
    end: z.union([z.string(), z.number()]),
  }),
]);

export const ListFilterConditionSchema = z.object({
  field: z.string(),
  op: z.string(),
  value: filterValueSchema,
  connector: z.enum(["AND", "OR"]).optional(),
});

export const ListFiltersQuerySchema = z.array(ListFilterConditionSchema).optional();

export const ListConnectorSchema = z.enum(["AND", "OR"]);

/**
 * Shared base for entity list query schemas. Entities extend it with their
 * own `sort_key` enum / extra params.
 */
export const ListQueryBaseSchema = z.object({
  search: z.string().optional(),
  search_in: searchInSchema.optional(),
  sort_key: z.string().optional().nullable(),
  sort_dir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  page_size: z.coerce.number().int().min(1).max(100).optional(),
  filters: ListFiltersQuerySchema,
  connector: ListConnectorSchema.optional(),
  deleted_records: z.enum(["EXCLUDED", "ONLY", "INCLUDED"]).optional(),
});

/**
 * `{entity}` write envelope — strict, no `translations` sibling (piggyback
 * translation writes are gateway-owned; a US entity route must not accept
 * them — same contract as the BE's `entityOnlyWriteBody`).
 */
export function entityOnlyWriteBody<S extends z.ZodTypeAny>(entitySchema: S) {
  return z.object({ entity: entitySchema }).strict();
}
