/**
 * MarketingQualificationsService — `marketing_qualification` domain service.
 * Canonical `DomainService` shape; `marketing_qualifications_audit` exists.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { MarketingQualificationEntity } from "../../domain/entities/marketing_qualification_entity.js";
import {
  MARKETING_QUALIFICATION_DEFAULT_SORT,
} from "./list-config.js";
import { MARKETING_QUALIFICATION_SEARCHABLE_KEYS, MARKETING_QUALIFICATION_FILTERABLE_KEYS } from "./marketing_qualification.meta.js";

export class MarketingQualificationsService extends DomainService<MarketingQualificationEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: MarketingQualificationEntity,
      actor: requireActor,
      list: {
        searchableKeys: MARKETING_QUALIFICATION_SEARCHABLE_KEYS,
        filterableKeys: new Set(MARKETING_QUALIFICATION_FILTERABLE_KEYS),
        defaultSort: MARKETING_QUALIFICATION_DEFAULT_SORT,
      },
    });
  }
}
