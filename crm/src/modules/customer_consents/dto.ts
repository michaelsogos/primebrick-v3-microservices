import { z } from "zod";
import { ListQueryBaseSchema } from "../shared/validation.js";
import { CUSTOMER_CONSENT_SORT_KEYS } from "./list-config.js";

export const CustomerConsentListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(CUSTOMER_CONSENT_SORT_KEYS as [string, ...string[]]).optional(),
});

export const CustomerConsentAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
