/**
 * CustomersService — the `customer` domain worker service.
 *
 * Extends `DomainService<CustomerEntity>` — THE canonical shape: the class
 * IS an `EntityService` (handed to the entity router unchanged), the generic
 * CRUD/list/stream/audit surface comes from the composed `this.svc`, and
 * per-entity variation lives ONLY in the config object below plus method
 * overrides that carry real domain rules.
 *
 * `customers_audit` exists (the entity declares `@AuditTrail`) so the default
 * `makeTableAuditPort(repo)` writer is correct — no `auditPort` override.
 * Display-name joins (`created_by_name`/`updated_by_name`/audit
 * `changed_by_display_name`) are the platform invariant wired inside
 * dal-pg (`public.user_profiles`), never configured here.
 *
 * NEVER reintroduce a hand-written CustomersDal/CustomersRepo: per-entity
 * variation belongs in the config object or in domain methods, not in
 * copied code.
 */

import { Filter, field, DomainService, type DuplicateResult } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { CustomerEntity } from "../../domain/entities/customer_entity.js";
import {
  CUSTOMER_DEFAULT_SORT,
  CUSTOMER_SEARCHABLE_KEYS,
  CUSTOMER_FILTERABLE_KEYS,
} from "./list-config.js";

export class CustomersService extends DomainService<CustomerEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: CustomerEntity,
      actor: requireActor,
      list: {
        searchableKeys: CUSTOMER_SEARCHABLE_KEYS,
        filterableKeys: new Set(CUSTOMER_FILTERABLE_KEYS),
        defaultSort: CUSTOMER_DEFAULT_SORT,
        // Entity-specific shortcut param: ?status=ACTIVE|...
        extraFilters: (q) =>
          q.status
            ? [Filter.group([Filter.fieldValue(field(CustomerEntity, "status"), "=", q.status)], "AND")]
            : [],
      },
    });
  }

  /**
   * Duplicate is all-or-report: any per-row failure is surfaced as an
   * error (the router maps it to RFC 7807 500) instead of a silent
   * partial-success 200.
   */
  override async duplicate(uuids: string[]): Promise<DuplicateResult> {
    const result = await super.duplicate(uuids);
    if (result.errors.length > 0) {
      throw new Error(
        `${result.errors.length} of ${uuids.length} records could not be duplicated`,
      );
    }
    return result;
  }
}
