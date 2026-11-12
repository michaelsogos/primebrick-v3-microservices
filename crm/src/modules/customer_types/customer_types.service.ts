/**
 * CustomerTypesService — `customer_type` domain service.
 * Canonical `DomainService` shape: per-entity variation lives in the config
 * object (list keys + default sort); `customer_types_audit` exists so the
 * default `makeTableAuditPort` writer is correct.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { CustomerTypeEntity } from "../../domain/entities/customer_type_entity.js";
import {
  CUSTOMER_TYPE_DEFAULT_SORT,
} from "./list-config.js";
import { CUSTOMER_TYPE_SEARCHABLE_KEYS, CUSTOMER_TYPE_FILTERABLE_KEYS } from "./customer_type.meta.js";

export class CustomerTypesService extends DomainService<CustomerTypeEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: CustomerTypeEntity,
      actor: requireActor,
      list: {
        searchableKeys: CUSTOMER_TYPE_SEARCHABLE_KEYS,
        filterableKeys: new Set(CUSTOMER_TYPE_FILTERABLE_KEYS),
        defaultSort: CUSTOMER_TYPE_DEFAULT_SORT,
      },
    });
  }
}
