/**
 * CustomerContactsService — `customer_contact` domain service.
 * Canonical `DomainService` shape; `customer_contacts_audit` exists.
 */
import { DomainService, resolveDisplayTemplate } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { CustomerContactEntity } from "../../domain/entities/customer_contact_entity.js";
import {
  CUSTOMER_CONTACT_DEFAULT_SORT,
} from "./list-config.js";
import { customerContactMeta } from "./customer_contact.meta.js";

export class CustomerContactsService extends DomainService<CustomerContactEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: CustomerContactEntity,
      actor: requireActor,
      display: resolveDisplayTemplate(customerContactMeta),
      list: {
        meta: customerContactMeta,
        defaultSort: CUSTOMER_CONTACT_DEFAULT_SORT,
      },
    });
  }
}
