/**
 * AiModelsService — thin facade over `makeEntityService` (dal-pg).
 *
 * Core CRUD is generic; this facade wires the ai-schema repository + audit
 * port plus the entity-specific write rules:
 *   - `power_level` is always DERIVED from `working_set_mb`, never manual;
 *   - (model_id, dtype) uniqueness is pre-checked on update so the caller
 *     gets a domain error instead of a raw conflict.
 *
 * Migrated from the BE's `modules/ai-models` — `internal_code`s preserved so
 * FE error handling keeps working.
 */
import { type EntityService } from "@primebrick/dal-pg";
import { ValidationError } from "@primebrick/sdk";
import { AiModelEntity } from "../../domain/entities/ai_model_entity.js";
import type {
  AiModelCreateBody,
  AiModelUpdateBody,
  AiModelListQuery,
  AiModelDetailDto,
} from "./dto.js";
import {
  AI_MODEL_DEFAULT_SORT,
  AI_MODEL_SEARCHABLE_KEYS,
  AI_MODEL_FILTERABLE_KEYS,
} from "./list-config.js";
import { powerLevelFromWorkingSet } from "./power-level.js";
import { entityActor } from "../../db/entity-repo.js";
import { getDal } from "../../db/dal.js";

export class AiModelsService {
  private svc: EntityService<AiModelDetailDto>;

  constructor() {
    this.svc = getDal().entityService<AiModelDetailDto>({
      entity: AiModelEntity,
      actor: entityActor,
      list: {
        searchableKeys: AI_MODEL_SEARCHABLE_KEYS,
        filterableKeys: new Set(AI_MODEL_FILTERABLE_KEYS),
        defaultSort: AI_MODEL_DEFAULT_SORT,
      },
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
    });
  }

  // Canonical EntityService surface — consumed by the entity router.

  list(query: AiModelListQuery) {
    return this.svc.list(query);
  }

  get(uuid: string) {
    return this.svc.get(uuid);
  }

  create(body: AiModelCreateBody) {
    return this.svc.create(body as unknown as Record<string, unknown>);
  }

  update(uuid: string, body: AiModelUpdateBody) {
    return this.svc.update(
      uuid,
      body as unknown as Record<string, unknown> & { version: number },
    );
  }

  delete(uuid: string, version: number) {
    return this.svc.delete(uuid, version);
  }

  restore(uuid: string, version: number) {
    return this.svc.restore(uuid, version);
  }

  audit(uuid: string, page: number, limit: number) {
    return this.svc.audit(uuid, page, limit);
  }

  purge(uuid: string, version: number) {
    return this.svc.purge(uuid, version);
  }

  duplicate(uuids: string[]) {
    return this.svc.duplicate(uuids);
  }

  bulkDelete(items: Array<{ uuid: string; version: number }>) {
    return this.svc.bulkDelete(items);
  }

  bulkRestore(items: Array<{ uuid: string; version: number }>) {
    return this.svc.bulkRestore(items);
  }
}
