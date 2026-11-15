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

// Edge ends are immutable (served meta `immutable:true` — create-set,
// frozen afterwards): repointing an edge is DELETE + CREATE, never an
// update. The only mutable payload is `type_uuid` — the relationship
// may evolve while the two endpoints stay the same edge.
export const CustomerLinkUpdateBodySchema = zPartialNoDefaults(
  z.object({
    type_uuid: z.string().uuid(),
    version: zBoundedInt(0, Number.MAX_SAFE_INTEGER),
  }).strict(),
);

export const CustomerLinkAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
