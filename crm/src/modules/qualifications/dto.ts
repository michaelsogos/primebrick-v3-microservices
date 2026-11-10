import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { QUALIFICATION_SORT_KEYS } from "./qualification.meta.js";

export const QualificationListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(QUALIFICATION_SORT_KEYS as [string, ...string[]]).optional(),
});

const QualificationBaseSchema = z.object({
  code: z.string().min(1).max(50),
  label_key: z.string().min(1).max(100).optional(),
  sort: z.coerce.number().int().min(0).default(0),
});

export const QualificationCreateBodySchema = QualificationBaseSchema;
export const QualificationUpdateBodySchema = zPartialNoDefaults(
  QualificationBaseSchema.extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }),
);

export const QualificationAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
