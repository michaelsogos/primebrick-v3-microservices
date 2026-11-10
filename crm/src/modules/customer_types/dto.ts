import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { CUSTOMER_TYPE_SORT_KEYS } from "./customer_type.meta.js";

export const CustomerTypeListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(CUSTOMER_TYPE_SORT_KEYS as [string, ...string[]]).optional(),
});

const CustomerTypeBaseSchema = z.object({
  code: z.string().min(1).max(50),
  label_key: z.string().min(1).max(100).optional(),
  sort: z.coerce.number().int().min(0).default(0),
});

export const CustomerTypeCreateBodySchema = CustomerTypeBaseSchema;
export const CustomerTypeUpdateBodySchema = zPartialNoDefaults(
  CustomerTypeBaseSchema.extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }),
);

export const CustomerTypeAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
