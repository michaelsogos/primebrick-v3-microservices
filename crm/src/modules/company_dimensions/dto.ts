import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { COMPANY_DIMENSION_SORT_KEYS } from "./list-config.js";

export const CompanyDimensionListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(COMPANY_DIMENSION_SORT_KEYS as [string, ...string[]]).optional(),
});

const CompanyDimensionBaseSchema = z.object({
  code: z.string().min(1).max(50),
  label_key: z.string().min(1).max(100).optional(),
  min_size: z.coerce.number().int().min(0),
  max_size: z.coerce.number().int().min(0).optional(),
  sort: z.coerce.number().int().min(0).default(0),
});

export const CompanyDimensionCreateBodySchema = CompanyDimensionBaseSchema;
export const CompanyDimensionUpdateBodySchema = zPartialNoDefaults(
  CompanyDimensionBaseSchema.extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }),
);

export const CompanyDimensionAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
