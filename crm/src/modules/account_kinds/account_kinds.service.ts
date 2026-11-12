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
import { ACCOUNT_KIND_SEARCHABLE_KEYS, ACCOUNT_KIND_FILTERABLE_KEYS } from "./account_kind.meta.js";

export class AccountKindsService extends DomainService<AccountKindEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: AccountKindEntity,
      actor: requireActor,
      list: {
        searchableKeys: ACCOUNT_KIND_SEARCHABLE_KEYS,
        filterableKeys: new Set(ACCOUNT_KIND_FILTERABLE_KEYS),
        defaultSort: ACCOUNT_KIND_DEFAULT_SORT,
      },
    });
  }
}
