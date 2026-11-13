/**
 * AiModelsService — `ai_model` domain service on `DomainService`.
 *
 * Core CRUD is generic; the entity-specific write rules live in `hooks`:
 *   - `power_level` is always DERIVED from `working_set_mb`, never manual;
 *   - (model_id, dtype) uniqueness is pre-checked on update so the caller
 *     gets a domain error instead of a raw conflict.
 *
 * Migrated from the BE's `modules/ai-models` — `internal_code`s preserved so
 * FE error handling keeps working.
 */
import { DomainService, type EntityServiceConfig } from "@primebrick/dal-pg";
import { ValidationError } from "@primebrick/sdk";
import { AiModelEntity } from "../../domain/entities/ai_model_entity.js";
import type { AiModelDetailDto } from "./dto.js";
import { AI_MODEL_DEFAULT_SORT } from "./list-config.js";
import { AI_MODEL_SEARCHABLE_KEYS, AI_MODEL_FILTERABLE_KEYS } from "./ai_models.meta.js";
import { powerLevelFromWorkingSet } from "./power-level.js";
import { entityActor } from "../../db/entity-repo.js";

type T = AiModelDetailDto & Record<string, unknown>;

export class AiModelsService extends DomainService<T> {
  constructor() {
    super({
      entity: AiModelEntity,
      actor: entityActor,
      list: {
        searchableKeys: AI_MODEL_SEARCHABLE_KEYS,
        filterableKeys: new Set(AI_MODEL_FILTERABLE_KEYS),
        defaultSort: AI_MODEL_DEFAULT_SORT,
      },
    });
  }

  /** Write rules live here — they read through `this.svc`, which must be
   *  the fully-resolved composed service (unavailable inside `super()`). */
  protected override buildConfig(): EntityServiceConfig<T> {
    return {
      ...super.buildConfig(),
      hooks: {
        beforeCreate: (body) => {
          // power_level is always derived from working_set_mb.
          const derived = powerLevelFromWorkingSet(body.working_set_mb as number | undefined);
          return derived !== null ? { ...body, power_level: derived } : body;
        },
        beforeUpdate: async (uuid, body) => {
          // If the variant identity (model_id or dtype) is being changed,
          // check uniqueness of the effective pair against other rows.
          if (body.model_id !== undefined || body.dtype !== undefined) {
            const current = await this.svc.get(uuid); // NotFoundError propagates
            const effectiveModelId = (body.model_id ?? current.model_id) as string;
            const effectiveDtype = body.dtype !== undefined ? body.dtype : current.dtype;
            const candidates = await this.svc.list({
              filters: [{ field: "model_id", op: "=", value: effectiveModelId }],
              page_size: 100,
            });
            const clash = candidates.rows.find(
              (r) => r.uuid !== uuid && r.dtype === effectiveDtype,
            );
            if (clash) {
              throw new ValidationError(
                "An AI model with this model_id already exists",
              );
            }
          }
          const derived = powerLevelFromWorkingSet(body.working_set_mb as number | undefined);
          return derived !== null ? { ...body, power_level: derived } : body;
        },
      },
    };
  }
}
