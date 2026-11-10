import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { LOCAL_ADDRESS_SORT_KEYS } from "./local_address.meta.js";

export const LocalAddressListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(LOCAL_ADDRESS_SORT_KEYS as [string, ...string[]]).optional(),
});

const LocalAddressBaseSchema = z.object({
  /** True FK → crm.customers(id) — bigint arrives as string/number over JSON. */
  customer_id: z.coerce.bigint().positive(),
  /** Lazy ref → local_address_types.uuid. */
  type_uuid: z.string().uuid(),
  street: z.string().min(1),
  /** Street line 2 (UK-style two-line addresses, c/o, internal notes). */
  street2: z.string().min(1).optional(),
  postal_code: z.string().min(1).max(20),
  city: z.string().min(1),
  province: z.string().min(1).optional(),
  /** ISO 3166-1 alpha-2. */
  country: z.string().length(2),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  poi_name: z.string().min(1).optional(),
});

export const LocalAddressCreateBodySchema = LocalAddressBaseSchema;
export const LocalAddressUpdateBodySchema = zPartialNoDefaults(
  LocalAddressBaseSchema.extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }),
);

export const LocalAddressAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
