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
import { companyDimensionMeta } from "./company_dimension.meta.js";

export class CompanyDimensionsService extends DomainService<CompanyDimensionEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: CompanyDimensionEntity,
      actor: requireActor,
      list: {
        meta: companyDimensionMeta,
        defaultSort: COMPANY_DIMENSION_DEFAULT_SORT,
      },
    });
  }
}
