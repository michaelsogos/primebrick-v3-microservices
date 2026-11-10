/**
 * CompanyDimensionsService — `company_dimension` domain service.
 * Canonical `DomainService` shape; `company_dimensions_audit` exists.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { CompanyDimensionEntity } from "../../domain/entities/company_dimension_entity.js";
import {
  COMPANY_DIMENSION_DEFAULT_SORT,
} from "./list-config.js";
import { COMPANY_DIMENSION_SEARCHABLE_KEYS, COMPANY_DIMENSION_FILTERABLE_KEYS } from "./company_dimension.meta.js";

export class CompanyDimensionsService extends DomainService<CompanyDimensionEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: CompanyDimensionEntity,
      actor: requireActor,
      list: {
        searchableKeys: COMPANY_DIMENSION_SEARCHABLE_KEYS,
        filterableKeys: new Set(COMPANY_DIMENSION_FILTERABLE_KEYS),
        defaultSort: COMPANY_DIMENSION_DEFAULT_SORT,
      },
    });
  }
}
