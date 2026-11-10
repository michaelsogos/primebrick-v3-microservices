/**
 * QualificationsService — `qualification` domain service.
 * Canonical `DomainService` shape; `qualifications_audit` exists.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { QualificationEntity } from "../../domain/entities/qualification_entity.js";
import {
  QUALIFICATION_DEFAULT_SORT,
} from "./list-config.js";
import { QUALIFICATION_SEARCHABLE_KEYS, QUALIFICATION_FILTERABLE_KEYS } from "./qualification.meta.js";

export class QualificationsService extends DomainService<QualificationEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: QualificationEntity,
      actor: requireActor,
      list: {
        searchableKeys: QUALIFICATION_SEARCHABLE_KEYS,
        filterableKeys: new Set(QUALIFICATION_FILTERABLE_KEYS),
        defaultSort: QUALIFICATION_DEFAULT_SORT,
      },
    });
  }
}
