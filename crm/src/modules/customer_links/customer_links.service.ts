/**
 * CustomerLinksService — `customer_link` domain service (N-N org graph edge).
 * Canonical `DomainService` shape; `customer_links_audit` exists.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { CustomerLinkEntity } from "../../domain/entities/customer_link_entity.js";
import {
  CUSTOMER_LINK_DEFAULT_SORT,
  CUSTOMER_LINK_FILTERABLE_KEYS,
  CUSTOMER_LINK_SEARCHABLE_KEYS,
} from "./list-config.js";

export class CustomerLinksService extends DomainService<CustomerLinkEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: CustomerLinkEntity,
      actor: requireActor,
      list: {
        searchableKeys: CUSTOMER_LINK_SEARCHABLE_KEYS,
        filterableKeys: new Set(CUSTOMER_LINK_FILTERABLE_KEYS),
        defaultSort: CUSTOMER_LINK_DEFAULT_SORT,
      },
    });
  }
}
