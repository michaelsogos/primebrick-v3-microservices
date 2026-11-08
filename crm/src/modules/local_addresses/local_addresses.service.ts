/**
 * LocalAddressesService — `local_address` domain service.
 * Canonical `DomainService` shape; `local_addresses_audit` exists.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { LocalAddressEntity } from "../../domain/entities/local_address_entity.js";
import {
  LOCAL_ADDRESS_DEFAULT_SORT,
  LOCAL_ADDRESS_FILTERABLE_KEYS,
  LOCAL_ADDRESS_SEARCHABLE_KEYS,
} from "./list-config.js";

export class LocalAddressesService extends DomainService<LocalAddressEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: LocalAddressEntity,
      actor: requireActor,
      list: {
        searchableKeys: LOCAL_ADDRESS_SEARCHABLE_KEYS,
        filterableKeys: new Set(LOCAL_ADDRESS_FILTERABLE_KEYS),
        defaultSort: LOCAL_ADDRESS_DEFAULT_SORT,
      },
    });
  }
}
