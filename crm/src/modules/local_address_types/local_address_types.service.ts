/**
 * LocalAddressTypesService — `local_address_type` domain service.
 * Canonical `DomainService` shape; `local_address_types_audit` exists.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { LocalAddressTypeEntity } from "../../domain/entities/local_address_type_entity.js";
import {
  LOCAL_ADDRESS_TYPE_DEFAULT_SORT,
} from "./list-config.js";
import { LOCAL_ADDRESS_TYPE_SEARCHABLE_KEYS, LOCAL_ADDRESS_TYPE_FILTERABLE_KEYS } from "./local_address_type.meta.js";

export class LocalAddressTypesService extends DomainService<LocalAddressTypeEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: LocalAddressTypeEntity,
      actor: requireActor,
      list: {
        searchableKeys: LOCAL_ADDRESS_TYPE_SEARCHABLE_KEYS,
        filterableKeys: new Set(LOCAL_ADDRESS_TYPE_FILTERABLE_KEYS),
        defaultSort: LOCAL_ADDRESS_TYPE_DEFAULT_SORT,
      },
    });
  }
}
