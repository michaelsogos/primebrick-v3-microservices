import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { MARKETING_QUALIFICATION_SORT_KEYS } from "./marketing_qualification.meta.js";

export const MarketingQualificationListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(MARKETING_QUALIFICATION_SORT_KEYS as [string, ...string[]]).optional(),
});

const MarketingQualificationBaseSchema = z.object({
  code: z.string().min(1).max(50),
  label_key: z.string().min(1).max(100).optional(),
  sort: z.coerce.number().int().min(0).default(0),
});

export const MarketingQualificationCreateBodySchema = MarketingQualificationBaseSchema;
export const MarketingQualificationUpdateBodySchema = zPartialNoDefaults(
  MarketingQualificationBaseSchema.extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }),
);

export const MarketingQualificationAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
