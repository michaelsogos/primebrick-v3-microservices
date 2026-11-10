import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { CUSTOMER_CONTACT_SORT_KEYS } from "./customer_contact.meta.js";

export const CustomerContactListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(CUSTOMER_CONTACT_SORT_KEYS as [string, ...string[]]).optional(),
});

const CustomerContactBaseSchema = z.object({
  /** True FK → crm.customers(id). */
  customer_id: z.coerce.bigint().positive(),
  /** Lazy ref → contact_types.uuid — its `value_kind` picks the
   *  `value` validation/renderer (email → email, phone → E.164). */
  type_uuid: z.string().uuid(),
  /** Channel value — format enforced against the type's `value_kind`
   *  on the FE (renderer) and by the domain flow, not here. */
  value: z.string().min(1).max(320),
  /** One default per (customer, type) — partial unique index enforced. */
  is_default: z.boolean().default(false),
  /** Free display label ("ufficio", "mobile", …). */
  label: z.string().min(1).optional(),
});

export const CustomerContactCreateBodySchema = CustomerContactBaseSchema;
export const CustomerContactUpdateBodySchema = zPartialNoDefaults(
  CustomerContactBaseSchema.extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }),
);

export const CustomerContactAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
