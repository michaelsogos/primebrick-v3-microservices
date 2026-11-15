/**
 * AiCerebellumService — `ai_cerebellum` domain service on `DomainService`.
 *
 * Core CRUD is generic; the entity-specific rule lives in `beforeCreate`:
 * a tuning preset name must be unique within the same (assistant_key,
 * model_id[, dtype]) triple.
 *
 * Migrated from the BE's `modules/ai-cerebellum`.
 */
import { DomainService, type EntityServiceConfig } from "@primebrick/dal-pg";
import { ValidationError } from "@primebrick/sdk";
import { AiCerebellumEntity } from "../../domain/entities/ai_cerebellum_entity.js";
import type { AiCerebellumDetailDto } from "./dto.js";
import { AI_CEREBELLUM_DEFAULT_SORT } from "./list-config.js";
import { aiCerebellumMeta } from "./ai_cerebellum.meta.js";
import { entityActor } from "../../db/entity-repo.js";

type T = AiCerebellumDetailDto & Record<string, unknown>;

export class AiCerebellumService extends DomainService<T> {
  constructor() {
    super({
      entity: AiCerebellumEntity,
      actor: entityActor,
      list: {
        meta: aiCerebellumMeta,
        defaultSort: AI_CEREBELLUM_DEFAULT_SORT,
      },
    });
  }

  /** Uniqueness check reads through `this.svc` — must run post-resolution. */
  protected override buildConfig(): EntityServiceConfig<T> {
    return {
      ...super.buildConfig(),
      hooks: {
        beforeCreate: async (body) => {
          // A tuning preset name must be unique within the same
          // assistant/model pair.
          const siblings = await this.svc.list({
            filters: [
              { field: "assistant_key", op: "=", value: body.assistant_key as string },
              { field: "model_id", op: "=", value: body.model_id as string },
              ...(body.dtype !== undefined && body.dtype !== null
                ? [{ field: "dtype", op: "=" as const, value: body.dtype as string }]
                : []),
            ],
            page_size: 100,
          });
          if (siblings.rows.some((t) => t.name === body.name)) {
            throw new ValidationError(
              "An AI cerebellum tuning with this name already exists for this assistant/model",
            );
          }
          return body;
        },
      },
    };
  }
}
