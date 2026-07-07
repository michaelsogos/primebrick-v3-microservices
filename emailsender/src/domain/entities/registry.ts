/**
 * Register every @Entity class so database patch tooling can scan them.
 * Add new entities here after creating the class file.
 */
import "reflect-metadata";

import type { EntityClass } from "@primebrick/dal-pg";
import { EmailConfigEntity } from "./email_config_entity.js";
import { EmailTemplateEntity } from "./email_template_entity.js";
import { EmailCommunicationLogEntity } from "./email_communication_log_entity.js";
import { ServiceRegistryEntity } from "./service_registry_entity.js";

export const ENTITY_REGISTRY = [
  EmailConfigEntity,
  EmailTemplateEntity,
  EmailCommunicationLogEntity,
  ServiceRegistryEntity,
] as const;

export { EmailConfigEntity, EmailTemplateEntity, EmailCommunicationLogEntity, ServiceRegistryEntity };
export type { EntityClass };
