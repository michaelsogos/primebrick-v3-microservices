/**
 * providers.service — `provider` domain service on `DomainService`.
 * Transport-free; consumed by the entity router.
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
import { DomainService, type EntityListQuery } from "@primebrick/dal-pg";
import { entityActor } from "../../db/entity-repo.js";
import { ProviderEntity } from "../../domain/entities/provider_entity.js";
import { providerMeta } from "./provider.meta.js";

/** Strip `api_key` from a list row — the secret never leaves in bulk reads. */
function maskListRow<T extends Record<string, unknown>>(row: T): T {
  const { api_key: _drop, ...rest } = row;
  return rest as T;
}

export class ProvidersService extends DomainService<ProviderEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: ProviderEntity,
      actor: entityActor,
      // No `providers_audit` table by requirement — silence the default
      // trail writer (writes still stamp the Auditable columns via actor).
      auditPort: { writeAudit: async () => 0n },
      list: {
        meta: providerMeta,
        defaultSort: { key: "updated_at", dir: "desc" },
      },
    });
  }

  override async list(query: EntityListQuery) {
    const result = await super.list(query);
    return { ...result, rows: result.rows.map(maskListRow) };
  }
}
