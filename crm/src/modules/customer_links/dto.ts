import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { CUSTOMER_LINK_SORT_KEYS } from "./customer_link.meta.js";

export const CustomerLinkListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(CUSTOMER_LINK_SORT_KEYS as [string, ...string[]]).optional(),
});

const CustomerLinkBaseSchema = z
  .object({
    /** True FK → crm.customers(id) — the org/relationship parent. */
    parent_customer_id: z.coerce.bigint().positive(),
    /** True FK → crm.customers(id) — subsidiary / private contact. */
    child_customer_id: z.coerce.bigint().positive(),
    /** Lazy ref → customer_link_types.uuid (subsidiary, employee, …). */
    type_uuid: z.string().uuid(),
  })
  .refine((v) => v.parent_customer_id !== v.child_customer_id, {
    message: "parent_customer_id and child_customer_id must differ",
    path: ["child_customer_id"],
  });

export const CustomerLinkCreateBodySchema = CustomerLinkBaseSchema;

// Update keeps the same edge contract — revalidation only when both ends
// are supplied (partial bodies pass the refine on the merged row server-side).
// The refine runs AFTER zPartialNoDefaults: zod 4 refuses `.partial()` on
// schemas carrying refinements.
export const CustomerLinkUpdateBodySchema = zPartialNoDefaults(
  z.object({
    parent_customer_id: z.coerce.bigint().positive(),
    child_customer_id: z.coerce.bigint().positive(),
    type_uuid: z.string().uuid(),
    version: zBoundedInt(0, Number.MAX_SAFE_INTEGER),
  }),
).refine(
  (v) =>
    v.parent_customer_id === undefined ||
    v.child_customer_id === undefined ||
    v.parent_customer_id !== v.child_customer_id,
  { message: "parent_customer_id and child_customer_id must differ", path: ["child_customer_id"] },
);

export const CustomerLinkAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
