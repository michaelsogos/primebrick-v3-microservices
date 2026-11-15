/**
 * ConsentTypesService — `consent_type` domain service.
 * Canonical `DomainService` shape; `consent_types_audit` exists.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { ConsentTypeEntity } from "../../domain/entities/consent_type_entity.js";
import {
  CONSENT_TYPE_DEFAULT_SORT,
} from "./list-config.js";
import { consentTypeMeta } from "./consent_type.meta.js";

export class ConsentTypesService extends DomainService<ConsentTypeEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: ConsentTypeEntity,
      actor: requireActor,
      list: {
        meta: consentTypeMeta,
        defaultSort: CONSENT_TYPE_DEFAULT_SORT,
      },
    });
  }
}
