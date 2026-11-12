import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { CUSTOMER_LINK_SORT_KEYS } from "./customer_link.meta.js";

export const CustomerLinkListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(CUSTOMER_LINK_SORT_KEYS as [string, ...string[]]).optional(),
});

const CustomerLinkBaseSchema = z
  .object({
    /** FK → crm.customers(uuid) — the org/relationship parent. */
    parent_customer_uuid: z.string().uuid(),
    /** FK → crm.customers(uuid) — subsidiary / private contact. */
    child_customer_uuid: z.string().uuid(),
    /** Lazy ref → customer_link_types.uuid (subsidiary, employee, …). */
    type_uuid: z.string().uuid(),
  })
  .refine((v) => v.parent_customer_uuid !== v.child_customer_uuid, {
    message: "parent_customer_uuid and child_customer_uuid must differ",
    path: ["child_customer_uuid"],
  });

export const CustomerLinkCreateBodySchema = CustomerLinkBaseSchema;

// Update keeps the same edge contract — revalidation only when both ends
// are supplied (partial bodies pass the refine on the merged row server-side).
// The refine runs AFTER zPartialNoDefaults: zod 4 refuses `.partial()` on
// schemas carrying refinements.
export const CustomerLinkUpdateBodySchema = zPartialNoDefaults(
  z.object({
    parent_customer_uuid: z.string().uuid(),
    child_customer_uuid: z.string().uuid(),
    type_uuid: z.string().uuid(),
    version: zBoundedInt(0, Number.MAX_SAFE_INTEGER),
  }),
).refine(
  (v) =>
    v.parent_customer_uuid === undefined ||
    v.child_customer_uuid === undefined ||
    v.parent_customer_uuid !== v.child_customer_uuid,
  { message: "parent_customer_uuid and child_customer_uuid must differ", path: ["child_customer_uuid"] },
);

export const CustomerLinkAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
