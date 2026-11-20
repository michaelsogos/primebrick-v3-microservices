import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { ACCOUNT_KIND_SORT_KEYS } from "./account_kind.meta.js";

export const AccountKindListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(ACCOUNT_KIND_SORT_KEYS as [string, ...string[]]).optional(),
});

const AccountKindBaseSchema = z.object({
  code: z.string().min(1).max(50),
  label_key: z.string().min(1).max(100).optional(),
  sort: z.coerce.number().int().min(0).default(0),
});

export const AccountKindCreateBodySchema = AccountKindBaseSchema;
export const AccountKindUpdateBodySchema = zPartialNoDefaults(
  AccountKindBaseSchema.omit({ code: true }).extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }).strict(),
);

export const AccountKindAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
