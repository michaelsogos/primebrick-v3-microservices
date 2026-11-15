/**
 * CustomerLinkTypesService — `customer_link_type` domain service.
 * Canonical `DomainService` shape; `customer_link_types_audit` exists.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { CustomerLinkTypeEntity } from "../../domain/entities/customer_link_type_entity.js";
import {
  CUSTOMER_LINK_TYPE_DEFAULT_SORT,
} from "./list-config.js";
import { customerLinkTypeMeta } from "./customer_link_type.meta.js";

export class CustomerLinkTypesService extends DomainService<CustomerLinkTypeEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: CustomerLinkTypeEntity,
      actor: requireActor,
      list: {
        meta: customerLinkTypeMeta,
        defaultSort: CUSTOMER_LINK_TYPE_DEFAULT_SORT,
      },
    });
  }
}
