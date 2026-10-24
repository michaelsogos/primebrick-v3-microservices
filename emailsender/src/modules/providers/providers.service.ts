/**
 * providers.service — entity-service facade over `makeEntityService` for
 * the `provider` entity. Transport-free; consumed by the entity router.
 *
 * `provider` is `Auditable`-columns (created_by/updated_at/version stamped
 * via `actor`) but has NO `providers_audit` trail table BY REQUIREMENT —
 * entities may be audit-columned without a trail. The `auditPort` seam
 * (the documented per-entity variation point in EntityServiceConfig)
 * suppresses the default table writer so writes don't log
 * `[DAL Audit Error]` on the intentionally-absent table.
 *
 * `api_key` never crosses the list boundary — the former RPC projection
 * excluded it; the service masks it here (domain read rule, same
 * secret→null convention as AI config entries). `get` still returns the
 * stored key for the edit form.
 */
import type { EntityListQuery, EntityListResult } from "@primebrick/dal-pg";
import { entityActor } from "../../db/entity-repo.js";
import { getDal } from "../../db/dal.js";
import { ProviderEntity } from "../../domain/entities/provider_entity.js";

const PROVIDER_FILTERABLE = new Set([
  "provider",
  "api_endpoint",
  "from_email",
  "from_name",
  "reply_to",
  "created_at",
  "updated_at",
]);

/** Strip `api_key` from a list row — the secret never leaves in bulk reads. */
function maskListRow<T extends Record<string, unknown>>(row: T): T {
  const { api_key: _drop, ...rest } = row;
  return rest as T;
}

export class ProvidersService {
  private svc = getDal().entityService<ProviderEntity & Record<string, unknown>>({
    entity: ProviderEntity,
    actor: entityActor,
    // No `providers_audit` table by requirement — silence the default
    // trail writer (writes still stamp the Auditable columns via actor).
    auditPort: { writeAudit: async () => {} },
    list: {
      searchableKeys: ["provider", "api_endpoint", "from_email", "from_name", "reply_to"],
      filterableKeys: PROVIDER_FILTERABLE,
      defaultSort: { key: "updated_at", dir: "desc" },
    },
  } as never);

  async list(query: EntityListQuery): Promise<EntityListResult<ProviderEntity & Record<string, unknown>>> {
    const result = await this.svc.list(query);
    return { ...result, rows: result.rows.map(maskListRow) };
  }

  get get() { return this.svc.get.bind(this.svc); }
  get create() { return this.svc.create.bind(this.svc); }
  get update() { return this.svc.update.bind(this.svc); }
  get delete() { return this.svc.delete.bind(this.svc); }
}
