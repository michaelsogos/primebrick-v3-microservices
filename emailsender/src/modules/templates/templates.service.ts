/**
 * templates.service — entity-service facade over `makeEntityService` for
 * the `email_template` entity. Transport-free; consumed by the entity
 * router.
 *
 * `email_template` is `Auditable`-columns (created_by/updated_at/version
 * stamped via `actor`) but has NO `email_templates_audit` trail table BY
 * REQUIREMENT — entities may be audit-columned without a trail. The
 * `auditPort` seam (the documented per-entity variation point in
 * EntityServiceConfig) suppresses the default table writer so writes
 * don't log `[DAL Audit Error]` on the intentionally-absent table.
 */
import type { EntityListQuery, EntityListResult } from "@primebrick/dal-pg";
import { entityActor } from "../../db/entity-repo.js";
import { getDal } from "../../db/dal.js";
import { EmailTemplateEntity } from "../../domain/entities/email_template_entity.js";

const TEMPLATE_FILTERABLE = new Set([
  "code",
  "language_iso",
  "subject",
  "created_at",
  "updated_at",
]);

export class TemplatesService {
  private svc = getDal().entityService<EmailTemplateEntity & Record<string, unknown>>({
    entity: EmailTemplateEntity,
    actor: entityActor,
    // No `email_templates_audit` table by requirement — silence the
    // default trail writer (writes still stamp the Auditable columns via
    // actor).
    auditPort: { writeAudit: async () => {} },
    list: {
      searchableKeys: ["code", "language_iso", "subject"],
      filterableKeys: TEMPLATE_FILTERABLE,
      defaultSort: { key: "updated_at", dir: "desc" },
    },
  } as never);

  get list() {
    return this.svc.list.bind(this.svc) as (
      query: EntityListQuery,
    ) => Promise<EntityListResult<EmailTemplateEntity & Record<string, unknown>>>;
  }
  get get() { return this.svc.get.bind(this.svc); }
  get create() { return this.svc.create.bind(this.svc); }
  get update() { return this.svc.update.bind(this.svc); }
  get delete() { return this.svc.delete.bind(this.svc); }
}
