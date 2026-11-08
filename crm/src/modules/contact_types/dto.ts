import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { CONTACT_TYPE_SORT_KEYS } from "./list-config.js";

export const ContactTypeListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(CONTACT_TYPE_SORT_KEYS as [string, ...string[]]).optional(),
});

const ContactTypeBaseSchema = z.object({
  code: z.string().min(1).max(50),
  label_key: z.string().min(1).max(100).optional(),
  /** Renderer/validation discriminator for `customer_contact.value`. */
  value_kind: z.enum(["email", "phone", "text"]).default("text"),
  sort: z.coerce.number().int().min(0).default(0),
});

export const ContactTypeCreateBodySchema = ContactTypeBaseSchema;
export const ContactTypeUpdateBodySchema = zPartialNoDefaults(
  ContactTypeBaseSchema.extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }),
);

export const ContactTypeAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
