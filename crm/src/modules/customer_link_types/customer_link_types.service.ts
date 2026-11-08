/**
 * CustomerLinkTypesService — `customer_link_type` domain service.
 * Canonical `DomainService` shape; `customer_link_types_audit` exists.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { CustomerLinkTypeEntity } from "../../domain/entities/customer_link_type_entity.js";
import {
  CUSTOMER_LINK_TYPE_DEFAULT_SORT,
  CUSTOMER_LINK_TYPE_FILTERABLE_KEYS,
  CUSTOMER_LINK_TYPE_SEARCHABLE_KEYS,
} from "./list-config.js";

export class CustomerLinkTypesService extends DomainService<CustomerLinkTypeEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: CustomerLinkTypeEntity,
      actor: requireActor,
      list: {
        searchableKeys: CUSTOMER_LINK_TYPE_SEARCHABLE_KEYS,
        filterableKeys: new Set(CUSTOMER_LINK_TYPE_FILTERABLE_KEYS),
        defaultSort: CUSTOMER_LINK_TYPE_DEFAULT_SORT,
      },
    });
  }
}
