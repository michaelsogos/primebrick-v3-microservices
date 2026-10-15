/**
 * Register every @Entity class so database patch tooling can scan them.
 * Add new entities here after creating the class file.
 */
import "reflect-metadata";

import type { EntityClass } from "@primebrick/dal-pg";
import { DocsKbEntity } from "./docs_kb_entity.js";
import { AiModelEntity } from "./ai_model_entity.js";
import { AiCerebellumEntity } from "./ai_cerebellum_entity.js";
import { ConfigEntryEntity } from "./config_entry_entity.js";
import { DocsIngestLogEntity } from "./docs_ingest_log_entity.js";
import { AiConversationEntity } from "./ai_conversation_entity.js";
import { AiMessageEntity } from "./ai_message_entity.js";
import { AiFeedbackEntity } from "./ai_feedback_entity.js";
import { AiTelemetryEntity } from "./ai_telemetry_entity.js";

export const ENTITY_REGISTRY = [
  DocsKbEntity,
  AiModelEntity,
  AiCerebellumEntity,
  ConfigEntryEntity,
  DocsIngestLogEntity,
  AiConversationEntity,
  AiMessageEntity,
  AiFeedbackEntity,
  AiTelemetryEntity,
] as const;

export {
  DocsKbEntity,
  AiModelEntity,
  AiCerebellumEntity,
  ConfigEntryEntity,
  DocsIngestLogEntity,
  AiConversationEntity,
  AiMessageEntity,
  AiFeedbackEntity,
  AiTelemetryEntity,
};
export type { EntityClass };
