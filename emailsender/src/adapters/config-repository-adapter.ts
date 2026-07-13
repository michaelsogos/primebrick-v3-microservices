import { getDal, field, Filter, NotFoundError } from "@primebrick/dal-pg";
import type { ConfigRepositoryPort } from "@primebrick/sdk";
import { ConfigEntryEntity } from "../domain/entities/config_entry_entity.js";

/**
 * Adapts @primebrick/dal-pg's Dal gateway to the SDK's ConfigRepositoryPort.
 * Used by ConfigLoader to read config rows from the emailsender.config table.
 */
export class ConfigRepositoryAdapter implements ConfigRepositoryPort {
  async findAll(): Promise<Array<{ key: string; value: string | null }>> {
    const dal = getDal();
    const rows = await dal.findAll<ConfigEntryEntity>(ConfigEntryEntity, null, {
      deletedRecords: "EXCLUDED",
    });
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => ({ key: r.key, value: r.value ?? null }));
  }
}
