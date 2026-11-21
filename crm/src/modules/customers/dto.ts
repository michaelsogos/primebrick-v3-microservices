import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults } from "../shared/validation.js";

import type { CustomerStatus } from "../../domain/entities/customer_entity.js";
import { CUSTOMER_SORT_KEYS } from "./customer.meta.js";
import {
  ListQueryBaseSchema,
  ListFiltersQuerySchema,
  ListFilterConditionSchema,
} from "../shared/validation.js";

export const CustomerStatusSchema = z.enum(["ACTIVE", "INACTIVE"]) satisfies z.ZodType<CustomerStatus>;

export const FilterQueryArraySchema = ListFiltersQuerySchema;
export type FilterCondition = z.infer<typeof ListFilterConditionSchema>;
export type FilterConnector = "AND" | "OR";

export const CustomerListQuerySchema = ListQueryBaseSchema.extend({
  status: CustomerStatusSchema.optional(),
  sort_key: z.enum(CUSTOMER_SORT_KEYS as [string, ...string[]]).optional(),
});

export type CustomerListQuery = z.infer<typeof CustomerListQuerySchema>;

const CustomerBaseSchema = z.object({
  // Seq-bound (@SequenceField on the entity): the wire value is a
  // sequence DIRECTIVE ({seq:…}) or is omitted (default allocation) —
  // never a literal. `entityFieldValidator`/`checkEntityFields` owns the
  // shape contract; this schema stays permissive so the predicate is the
  // single source.
  code: z.unknown().optional(),
  status: CustomerStatusSchema.default("ACTIVE"),
  status_reason: z.string().min(1).optional(),
  onboarding_at: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.coerce.date().optional()
  ),
  onboarding_time_zone: z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return undefined;
      return typeof v === "string" ? v.trim() : v;
    },
    z.string().min(2).max(100).optional()
  ),
  preferred_locale: z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return undefined;
      return typeof v === "string" ? v.trim() : v;
    },
    z.string().regex(/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})+$/, "preferred_locale must be a BCP-47 tag (e.g. it-IT, en-US)").max(35).optional()
  ),
  // Identity + lazy uuid links to the CRM dictionaries. Contact channels
  // live on `customer_contacts`, LU addresses on `local_addresses`, the
  // fiscal datasheet on `customer_accounts` — never flat on this row.
  display_name: z.string().min(1).optional(),
  customer_type_uuid: z.string().uuid().optional(),
  qualification_uuid: z.string().uuid().optional(),
  marketing_qualification_uuid: z.string().uuid().optional(),
  company_dimension_uuid: z.string().uuid().optional(),
});

// Refinement for create: both onboarding_at and onboarding_time_zone must be present together or absent together
export const CustomerCreateBodySchema = CustomerBaseSchema.superRefine((val, ctx) => {
  if (val.onboarding_at !== undefined && Number.isNaN(val.onboarding_at.getTime())) {
    ctx.addIssue({
      code: "custom",
      message: "Invalid onboarding_at",
      path: ["onboarding_at"],
    });
    return;
  }
  const hasAt = val.onboarding_at !== undefined;
  const hasTz = val.onboarding_time_zone !== undefined;
  if (hasAt === hasTz) return;
  if (hasAt && !hasTz) {
    ctx.addIssue({
      code: "custom",
      message: "onboarding_time_zone is required when onboarding_at is set",
      path: ["onboarding_time_zone"],
    });
  } else {
    ctx.addIssue({
      code: "custom",
      message: "onboarding_at is required when onboarding_time_zone is set",
      path: ["onboarding_at"],
    });
  }
});

export type CustomerCreateBody = z.infer<typeof CustomerCreateBodySchema>;

// Update schema: partial version of base schema with separate refinement for update case
export const CustomerUpdateBodySchema = zPartialNoDefaults(
  CustomerBaseSchema.extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }),
).superRefine((val, ctx) => {
  // For updates, only validate the cross-field constraint if both fields are provided
  const hasAt = val.onboarding_at !== undefined;
  const hasTz = val.onboarding_time_zone !== undefined;

  if (hasAt && val.onboarding_at && Number.isNaN(val.onboarding_at.getTime())) {
    ctx.addIssue({
      code: "custom",
      message: "Invalid onboarding_at",
      path: ["onboarding_at"],
    });
    return;
  }

  // If both are provided, they must both be present
  // If only one is provided, it's an error
  if (hasAt !== hasTz) {
    if (hasAt && !hasTz) {
      ctx.addIssue({
        code: "custom",
        message: "onboarding_time_zone is required when onboarding_at is set",
        path: ["onboarding_time_zone"],
      });
    } else {
      ctx.addIssue({
        code: "custom",
        message: "onboarding_at is required when onboarding_time_zone is set",
        path: ["onboarding_at"],
      });
    }
  }
});

export type CustomerUpdateBody = z.infer<typeof CustomerUpdateBodySchema>;

export const CustomerAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

export type CustomerAuditQuery = z.infer<typeof CustomerAuditQuerySchema>;

export const CustomerExportQuerySchema = CustomerListQuerySchema.extend({
  file_type: z.enum(["xlsx", "csv", "html"]),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

export type CustomerExportQuery = z.infer<typeof CustomerExportQuerySchema>;

export const CustomerDuplicateBodySchema = z.object({
  uuids: z.array(z.string().uuid()).min(1).max(50),
});

export type CustomerDuplicateBody = z.infer<typeof CustomerDuplicateBodySchema>;
