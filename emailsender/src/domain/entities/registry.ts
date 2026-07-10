/**
 * Register every @Entity class so database patch tooling can scan them.
 * Add new entities here after creating the class file.
 */
import "reflect-metadata";

import type { EntityClass } from "@primebrick/dal-pg";
import { ProviderEntity } from "./provider_entity.js";
import { EmailTemplateEntity } from "./email_template_entity.js";
import { SenderLogEntity } from "./sender_log_entity.js";
import { ServiceRegistryEntity } from "./service_registry_entity.js";
import { ConfigEntryEntity } from "./config_entry_entity.js";

export const ENTITY_REGISTRY = [
  ProviderEntity,
  EmailTemplateEntity,
  SenderLogEntity,
  ServiceRegistryEntity,
  ConfigEntryEntity,
] as const;

export { ProviderEntity, EmailTemplateEntity, SenderLogEntity, ServiceRegistryEntity, ConfigEntryEntity };
export type { EntityClass };
