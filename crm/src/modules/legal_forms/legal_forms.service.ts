/**
 * LegalFormsService — `legal_form` domain service (ISO 20275 dictionary).
 * Canonical `DomainService` shape; `legal_forms_audit` exists.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { LegalFormEntity } from "../../domain/entities/legal_form_entity.js";
import {
  LEGAL_FORM_DEFAULT_SORT,
} from "./list-config.js";
import { LEGAL_FORM_SEARCHABLE_KEYS, LEGAL_FORM_FILTERABLE_KEYS } from "./legal_form.meta.js";

export class LegalFormsService extends DomainService<LegalFormEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: LegalFormEntity,
      actor: requireActor,
      list: {
        searchableKeys: LEGAL_FORM_SEARCHABLE_KEYS,
        filterableKeys: new Set(LEGAL_FORM_FILTERABLE_KEYS),
        defaultSort: LEGAL_FORM_DEFAULT_SORT,
      },
    });
  }
}
