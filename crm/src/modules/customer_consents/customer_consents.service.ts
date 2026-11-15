/**
 * CustomerConsentsService — `customer_consent` domain service.
 * Canonical `DomainService` shape; `customer_consents_audit` exists.
 * Consent rows are written by domain flows (seal is computed server-side);
 * the entity route is read/audit-only by declaration.
 */
import { DomainService } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";

import { CustomerConsentEntity } from "../../domain/entities/customer_consent_entity.js";
import {
  CUSTOMER_CONSENT_DEFAULT_SORT,
} from "./list-config.js";
import { customerConsentMeta } from "./customer_consent.meta.js";

export class CustomerConsentsService extends DomainService<CustomerConsentEntity & Record<string, unknown>> {
  constructor() {
    super({
      entity: CustomerConsentEntity,
      actor: requireActor,
      list: {
        meta: customerConsentMeta,
        defaultSort: CUSTOMER_CONSENT_DEFAULT_SORT,
      },
    });
  }
}
