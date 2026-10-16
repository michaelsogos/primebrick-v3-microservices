/**
 * DTOs (Zod schemas + types) for the `ai_cerebellum` entity.
 */
import { z } from "zod";

import {
  zBoundedInt,
  zBoundedNumber,
  zPartialNoDefaults,
  ListQueryBaseSchema,
} from "../shared/validation.js";
import { AI_CEREBELLUM_SORT_KEYS } from "./list-config.js";

export const AiCerebellumListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(AI_CEREBELLUM_SORT_KEYS as [string, ...string[]]).optional(),
});

export type AiCerebellumListQuery = z.infer<typeof AiCerebellumListQuerySchema>;

const AiCerebellumBaseSchema = z.object({
  assistant_key: z.string().min(1).max(60),
  model_id: z.string().min(1).max(100),
  dtype: z.string().max(40).nullish(),
  name: z.string().min(1).max(80),
  description_key: z.string().min(1).max(200).optional(),
  enable_thinking: z.boolean().nullish(),
  temperature: zBoundedNumber(0.0, 2.0).nullish(),
  top_p: zBoundedNumber(0.01, 1.0).nullish(),
  max_tokens: zBoundedInt(1, 32768).nullish(),
  repetition_penalty: zBoundedNumber(1.0, 2.0).nullish(),
  execution_config: z.record(z.string(), z.any()).nullish(),
  test_scores: z.record(z.string(), z.any()).nullish(),
  recommendation: z.enum(["RECOMMENDED", "NOT_RECOMMENDED"]).nullish(),
  is_compatible: z.boolean().nullish(),
  is_default: z.boolean().nullish(),
});

export const AiCerebellumCreateBodySchema = AiCerebellumBaseSchema;

export type AiCerebellumCreateBody = z.infer<typeof AiCerebellumBaseSchema>;

export const AiCerebellumUpdateBodySchema = zPartialNoDefaults(
  AiCerebellumBaseSchema.extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }),
);

export type AiCerebellumUpdateBody = z.infer<typeof AiCerebellumUpdateBodySchema>;

export const AiCerebellumAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

export type AiCerebellumAuditQuery = z.infer<typeof AiCerebellumAuditQuerySchema>;

// --- Detail row / API DTO ---------------------------------------------------

export type AiCerebellumDetailRow = {
  uuid: string;
  assistant_key: string;
  model_id: string;
  dtype?: string;
  name: string;
  description_key?: string;
  enable_thinking?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  repetition_penalty?: number;
  execution_config?: Record<string, any>;
  test_scores?: Record<string, any>;
  recommendation?: string;
  is_compatible?: boolean;
  is_default?: boolean;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  version: number;
  deleted_at?: Date;
  deleted_by?: string;
};

export type AiCerebellumDetailDto = Omit<
  AiCerebellumDetailRow,
  "created_at" | "updated_at" | "deleted_at"
> & {
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};
