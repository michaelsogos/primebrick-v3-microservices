/**
 * CustomerAccountsService — `customer_account` domain service.
 * Canonical `DomainService` shape; `customer_accounts_audit` exists.
 */
import { DomainService, resolveDisplayTemplate } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { CustomerAccountEntity } from "../../domain/entities/customer_account_entity.js";
import {
  CUSTOMER_ACCOUNT_DEFAULT_SORT,
} from "./list-config.js";
import { customerAccountMeta } from "./customer_account.meta.js";

export class CustomerAccountsService extends DomainService<CustomerAccountEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: CustomerAccountEntity,
      actor: requireActor,
      display: resolveDisplayTemplate(customerAccountMeta),
      list: {
        meta: customerAccountMeta,
        defaultSort: CUSTOMER_ACCOUNT_DEFAULT_SORT,
      },
    });
  }
}
