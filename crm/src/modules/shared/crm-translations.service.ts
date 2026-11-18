/**
 * CrmTranslationsService — owns the module-dict read for the export
 * `dictResolver`. Merges two label sources:
 *   - `crm.entities.*` from `crm.translations` via the DAL Repository
 *     (module reads its own schema);
 *   - `system.common.*` from the governed `system.dict.get` NATS route —
 *     `system.translations` is BE-owned and no US may read it under schema
 *     sovereignty. Shared columns (uid/audit/common system fields) cite
 *     `system.common.fields.*` label keys.
 * `null` on a missing module dict lets the export pipeline fall back to
 * humanized keys; a missing TABLE is a provisioning failure and fails loud.
 * A failed system-dict call degrades to the module dict only — system keys
 * humanize, never throw the export away.
 */
import { DomainService, Filter, Project, field } from "@primebrick/dal-pg";
import { callNats, requireActor } from "@primebrick/sdk";
import { CrmTranslationEntity } from "../../domain/entities/crm_translation_entity.js";

const SYSTEM_DICT_GET_SUBJECT = "system.dict.get";

type CrmTranslationT = CrmTranslationEntity & Record<string, unknown>;

export class CrmTranslationsService extends DomainService<CrmTranslationT> {
  constructor() {
    super({
      entity: CrmTranslationEntity as never,
      actor: requireActor,
      // Read-side projection only — writes stay gateway-owned; no search
      // or filter surface is served.
      list: { searchableKeys: [], filterableKeys: new Set() },
    });
  }

  /** Merged `key → label` dict for `locale`, or null when neither source
   *  yields one. */
  async dict(locale: string): Promise<Record<string, string> | null> {
    const rows = await this.svc.query<{ dict: Record<string, string> | null }>(
      [Project.expr("jsonb_object_agg(key, value)", "dict")],
      {
        filters: [Filter.fieldValue(field(CrmTranslationEntity as never, "language"), "=", locale)],
      },
    );
    const moduleDict = rows[0]?.dict ?? null;
    const systemDict = await callNats<Record<string, string> | null>(
      SYSTEM_DICT_GET_SUBJECT,
      { module: "system", language: locale },
      { timeoutMs: 3000 },
    ).catch(() => null);
    if (moduleDict == null && systemDict == null) return null;
    // Module keys win on collision — namespace rule makes overlap impossible
    // by construction, but own-schema labels take precedence by convention.
    return { ...(systemDict ?? {}), ...(moduleDict ?? {}) };
  }
}
