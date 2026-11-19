/**
 * test-items.service — `test_item` domain service on `DomainService`.
 * Transport-free; consumed by the entity router.
 *
 * `test_item` is `Auditable`-columns (created_by, updated_at, version
 * stamped via `actor`) without an audit-trail table — entities may be
 * audit-columned without a trail. Opting into `@AuditTrail()` on the
 * entity is what turns trail writes on (the engine gates on the
 * decorator, not on a configured port).
 */
import { DomainService } from "@primebrick/dal-pg";
import { entityActor } from "../../db/entity-repo.js";
import { TestItemEntity } from "../../domain/entities/registry.js";
import { testItemMeta } from "./test-item.meta.js";

export class TestItemsService extends DomainService<TestItemEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: TestItemEntity,
      actor: entityActor,
      list: {
        meta: testItemMeta,
        defaultSort: { key: "updated_at", dir: "desc" },
      },
    });
  }
}
