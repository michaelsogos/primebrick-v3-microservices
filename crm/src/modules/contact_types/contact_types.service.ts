/**
 * ContactTypesService — `contact_type` domain service.
 * Canonical `DomainService` shape; `contact_types_audit` exists.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { ContactTypeEntity } from "../../domain/entities/contact_type_entity.js";
import {
  CONTACT_TYPE_DEFAULT_SORT,
} from "./list-config.js";
import { contactTypeMeta } from "./contact_type.meta.js";

export class ContactTypesService extends DomainService<ContactTypeEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: ContactTypeEntity,
      actor: requireActor,
      list: {
        meta: contactTypeMeta,
        defaultSort: CONTACT_TYPE_DEFAULT_SORT,
      },
    });
  }
}
