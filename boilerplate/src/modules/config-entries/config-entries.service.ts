/**
 * ConfigEntriesService — `config_entry` domain service on `DomainService`.
 *
 * Owns every `config_entries` read/write for the service schema: the
 * wire projection and the static-identity-key guard
 * (`assertWritableConfigKey` — deployed-artifact keys like `service_code`
 * are never runtime-editable). The guard lives in the `beforeUpdate`
 * hook so EVERY writer through svc hits it, not just the `updateValue`
 * call site.
 */
import {
  DomainService,
  field,
  Filter,
  Project,
  type EntityServiceConfig,
} from "@primebrick/dal-pg";
import { assertWritableConfigKey } from "@primebrick/sdk";
import { ConfigEntryEntity } from "../../domain/entities/config_entry_entity.js";
import { entityActor } from "../../db/entity-repo.js";

const configProjection = [
  Project.field(field(ConfigEntryEntity, "uuid")),
  Project.field(field(ConfigEntryEntity, "key")),
  Project.field(field(ConfigEntryEntity, "value")),
  Project.field(field(ConfigEntryEntity, "label_key")),
  Project.field(field(ConfigEntryEntity, "description_key")),
  // `version` is required on write (optimistic concurrency) — the FE must
  // receive it to send it back.
  Project.field(field(ConfigEntryEntity, "version")),
];

type ConfigEntryT = ConfigEntryEntity & Record<string, unknown>;

export class ConfigEntriesService extends DomainService<ConfigEntryT> {
  constructor() {
    super({
      entity: ConfigEntryEntity as never,
      actor: entityActor,
      // No served entity meta — the config_entry routes are custom RPC.
      list: { searchableKeys: ["key"], filterableKeys: new Set(["key", "type", "reserved"]) },
    });
  }

  protected override buildConfig(): EntityServiceConfig<ConfigEntryT> {
    return {
      ...super.buildConfig(),
      hooks: {
        beforeUpdate: async (uuid: string, body: Record<string, unknown>) => {
          const row = (await this.svc.get(uuid)) as { key?: string } | undefined;
          if (row?.key) assertWritableConfigKey(row.key);
          return body;
        },
      },
    };
  }

  /** All entries in the wire projection. */
  async listEntries(): Promise<ConfigEntryEntity[]> {
    const rows = (await this.dal.findAll(ConfigEntryEntity, configProjection)) as ConfigEntryEntity[];
    return Array.isArray(rows) ? rows : [];
  }

  /** Single entry by uuid in the wire projection. */
  async getEntry(uuid: string): Promise<ConfigEntryEntity | null> {
    return (await this.dal.find(ConfigEntryEntity, configProjection, {
      filters: [Filter.fieldValue(field(ConfigEntryEntity, "uuid"), "=", uuid)],
      throwIfNotFound: false,
    })) as ConfigEntryEntity | null;
  }

  /** Write `value` with optimistic lock — internalizes the domain rules
   *  the route used to hold: static-identity keys rejected
   *  (`assertWritableConfigKey` — deployed-artifact identity). Returns the
   *  re-read row — `null` when the uuid is unknown. */
  async updateValue(uuid: string, body: { value: unknown; version: number }): Promise<ConfigEntryEntity | null> {
    const target = (await this.dal.find(
      ConfigEntryEntity,
      [Project.field(field(ConfigEntryEntity, "key"))],
      {
        filters: [Filter.fieldValue(field(ConfigEntryEntity, "uuid"), "=", uuid)],
        throwIfNotFound: false,
      },
    )) as { key?: string } | null;
    if (!target?.key) return null;
    assertWritableConfigKey(target.key);
    // svc.update — the ambient HTTP session supplies the actor; the
    // beforeUpdate hook re-checks the key guard for every writer.
    await this.svc.update(uuid, { value: body.value as string, version: Number(body.version) });
    return this.getEntry(uuid);
  }
}
