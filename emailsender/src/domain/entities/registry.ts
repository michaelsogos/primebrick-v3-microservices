/**
 * Register every @Entity class so database patch tooling can scan them.
 * Add new entities here after creating the class file.
 */
import "reflect-metadata";

import type { EntityClass } from "./entity-decorators.js";
import { EmailConfigEntity } from "./email_config_entity.js";
import { EmailTemplateEntity } from "./email_template_entity.js";

export const ENTITY_REGISTRY = [
  EmailConfigEntity,
  EmailTemplateEntity,
] as const;
