/**
 * AiCerebellumService — thin facade over `makeEntityService` (dal-pg).
 *
 * Core CRUD is generic; the entity-specific rule lives in `beforeCreate`:
 * a tuning preset name must be unique within the same (assistant_key,
 * model_id[, dtype]) triple.
 *
 * Migrated from the BE's `modules/ai-cerebellum`.
 */
import { type EntityService } from "@primebrick/dal-pg";
import { ValidationError } from "@primebrick/sdk";
import { AiCerebellumEntity } from "../../domain/entities/ai_cerebellum_entity.js";
import type {
  AiCerebellumCreateBody,
  AiCerebellumUpdateBody,
  AiCerebellumListQuery,
  AiCerebellumDetailDto,
} from "./dto.js";
import {
  AI_CEREBELLUM_DEFAULT_SORT,
  AI_CEREBELLUM_SEARCHABLE_KEYS,
  AI_CEREBELLUM_FILTERABLE_KEYS,
} from "./list-config.js";
import { entityActor } from "../../db/entity-repo.js";
import { getDal } from "../../db/dal.js";

export class AiCerebellumService {
  private svc: EntityService<AiCerebellumDetailDto>;

  constructor() {
    this.svc = getDal().entityService<AiCerebellumDetailDto>({
      entity: AiCerebellumEntity,
      actor: entityActor,
      list: {
        searchableKeys: AI_CEREBELLUM_SEARCHABLE_KEYS,
        filterableKeys: new Set(AI_CEREBELLUM_FILTERABLE_KEYS),
        defaultSort: AI_CEREBELLUM_DEFAULT_SORT,
      },
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
    });
  }

  list(query: AiCerebellumListQuery) {
    return this.svc.list(query);
  }

  get(uuid: string) {
    return this.svc.get(uuid);
  }

  create(body: AiCerebellumCreateBody) {
    return this.svc.create(body as unknown as Record<string, unknown>);
  }

  update(uuid: string, body: AiCerebellumUpdateBody) {
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
