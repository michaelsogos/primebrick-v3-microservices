/**
 * Register every @Entity class so database patch tooling can scan them.
 */
import "reflect-metadata";

import type { EntityClass } from "@primebrick/dal-pg";
import { ConfigEntryEntity } from "./config_entry_entity.js";
import { CustomerEntity } from "./customer_entity.js";
import { CustomerTypeEntity } from "./customer_type_entity.js";
import { CompanyDimensionEntity } from "./company_dimension_entity.js";
import { LegalFormEntity } from "./legal_form_entity.js";
import { LocalAddressTypeEntity } from "./local_address_type_entity.js";
import { QualificationEntity } from "./qualification_entity.js";
import { MarketingQualificationEntity } from "./marketing_qualification_entity.js";
import { ContactTypeEntity } from "./contact_type_entity.js";
import { AccountKindEntity } from "./account_kind_entity.js";
import { CustomerLinkTypeEntity } from "./customer_link_type_entity.js";
import { ConsentTypeEntity } from "./consent_type_entity.js";
import { LocalAddressEntity } from "./local_address_entity.js";
import { CustomerAccountEntity } from "./customer_account_entity.js";
import { CustomerContactEntity } from "./customer_contact_entity.js";
import { CustomerConsentEntity } from "./customer_consent_entity.js";
import { CustomerLinkEntity } from "./customer_link_entity.js";

// The crm.translations table is intentionally NOT in this registry: its CRUD
// is owned by the BE central translations gateway (service_registry
// discovery → <code>.translations), same contract as job.translations.
// CrmTranslationEntity (read projection for the export dictResolver) is not
// registered either — it describes an already-provisioned table, not an
// ownership claim for patch tooling.
export const ENTITY_REGISTRY = [
  ConfigEntryEntity,
  CustomerEntity,
  CustomerTypeEntity,
  CompanyDimensionEntity,
  LegalFormEntity,
  LocalAddressTypeEntity,
  QualificationEntity,
  MarketingQualificationEntity,
  ContactTypeEntity,
  AccountKindEntity,
  CustomerLinkTypeEntity,
  ConsentTypeEntity,
  LocalAddressEntity,
  CustomerAccountEntity,
  CustomerContactEntity,
  CustomerConsentEntity,
  CustomerLinkEntity,
] as const;

export {
  ConfigEntryEntity,
  CustomerEntity,
  CustomerTypeEntity,
  CompanyDimensionEntity,
  LegalFormEntity,
  LocalAddressTypeEntity,
  QualificationEntity,
  MarketingQualificationEntity,
  ContactTypeEntity,
  AccountKindEntity,
  CustomerLinkTypeEntity,
  ConsentTypeEntity,
  LocalAddressEntity,
  CustomerAccountEntity,
  CustomerContactEntity,
  CustomerConsentEntity,
  CustomerLinkEntity,
};
export type { EntityClass };
