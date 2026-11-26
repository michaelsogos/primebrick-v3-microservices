import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { CUSTOMER_LINK_TYPE_SORT_KEYS } from "./customer_link_type.meta.js";

export const CustomerLinkTypeListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(CUSTOMER_LINK_TYPE_SORT_KEYS as [string, ...string[]]).optional(),
});

const CustomerLinkTypeBaseSchema = z.object({
  code: z.string().min(1).max(50),
  label_key: z.string().min(1).max(100).optional(),
  /** Directional inverse label — NULL = self-inverse type. */
  inverse_label_key: z.string().min(1).max(100).nullish(),
  sort: z.coerce.number().int().min(0).default(0),
});

export const CustomerLinkTypeCreateBodySchema = CustomerLinkTypeBaseSchema;
export const CustomerLinkTypeUpdateBodySchema = zPartialNoDefaults(
  CustomerLinkTypeBaseSchema.omit({ code: true }).extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }).strict(),
);

export const CustomerLinkTypeAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
