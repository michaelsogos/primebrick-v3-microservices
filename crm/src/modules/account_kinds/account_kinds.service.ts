/**
 * AccountKindsService — `account_kind` domain service.
 * Canonical `DomainService` shape; `account_kinds_audit` exists.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { AccountKindEntity } from "../../domain/entities/account_kind_entity.js";
import {
  ACCOUNT_KIND_DEFAULT_SORT,
} from "./list-config.js";
import { accountKindMeta } from "./account_kind.meta.js";

export class AccountKindsService extends DomainService<AccountKindEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: AccountKindEntity,
      actor: requireActor,
      list: {
        meta: accountKindMeta,
        defaultSort: ACCOUNT_KIND_DEFAULT_SORT,
      },
    });
  }
}
