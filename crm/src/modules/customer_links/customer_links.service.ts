/**
 * CustomerLinksService — `customer_link` domain service (N-N org graph edge).
 * Canonical `DomainService` shape; `customer_links_audit` exists.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { CustomerLinkEntity } from "../../domain/entities/customer_link_entity.js";
import {
  CUSTOMER_LINK_DEFAULT_SORT,
} from "./list-config.js";
import { customerLinkMeta } from "./customer_link.meta.js";

export class CustomerLinksService extends DomainService<CustomerLinkEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: CustomerLinkEntity,
      actor: requireActor,
      list: {
        meta: customerLinkMeta,
        defaultSort: CUSTOMER_LINK_DEFAULT_SORT,
      },
    });
  }
}
