/**
 * Register every @Entity class so database patch tooling can scan them.
 */
import "reflect-metadata";

import type { EntityClass } from "@primebrick/dal-pg";
import { ConfigEntryEntity } from "./config_entry_entity.js";
import { CustomerEntity } from "./customer_entity.js";

// The crm.translations table is intentionally NOT in this registry: its CRUD
// is owned by the BE central translations gateway (service_registry
// discovery → <code>.translations), same contract as job.translations.
// CrmTranslationEntity (read projection for the export dictResolver) is not
// registered either — it describes an already-provisioned table, not an
// ownership claim for patch tooling.
export const ENTITY_REGISTRY = [
  ConfigEntryEntity,
  CustomerEntity,
] as const;

export { ConfigEntryEntity, CustomerEntity };
export type { EntityClass };
