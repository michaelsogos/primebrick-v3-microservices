import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { LOCAL_ADDRESS_TYPE_SORT_KEYS } from "./local_address_type.meta.js";

export const LocalAddressTypeListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(LOCAL_ADDRESS_TYPE_SORT_KEYS as [string, ...string[]]).optional(),
});

const LocalAddressTypeBaseSchema = z.object({
  code: z.string().min(1).max(50),
  label_key: z.string().min(1).max(100).optional(),
  sort: z.coerce.number().int().min(0).default(0),
});

export const LocalAddressTypeCreateBodySchema = LocalAddressTypeBaseSchema;
export const LocalAddressTypeUpdateBodySchema = zPartialNoDefaults(
  LocalAddressTypeBaseSchema.extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }),
);

export const LocalAddressTypeAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
