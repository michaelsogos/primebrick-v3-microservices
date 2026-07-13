/**
 * Integration test setup helper for emailsender.
 *
 * Provides:
 * - initDal() once via the getDal() gateway (the gateway owns the pg.Pool,
 *   registers type parsers, sets search_path/statement_timeout).
 * - Idempotent DDL for the sender_log table (the only
 *   emailsender table NOT created by the existing migration patches — it
 *   exists in the entity snapshot but has no patch yet).
 * - TRUNCATE between tests for isolation.
 * - Seed helpers for ProviderEntity and EmailTemplateEntity rows.
 *
 * The other tables (providers, email_templates, config, public.service_registry)
 * are assumed to already exist in the DB (created by the migration patches or
 * manually). This helper only creates what's missing.
 */
import "dotenv/config";
import { getDal, resetDal, type DalConfig } from "@primebrick/dal-pg";
import { ProviderEntity, EmailTemplateEntity, SenderLogEntity } from "../../src/domain/entities/registry.js";
import { Filter, field } from "@primebrick/dal-pg";

let dalInitialized = false;

/**
 * Initialize the Dal gateway singleton once. Subsequent calls are no-ops.
 * Reads DATABASE_URL and DB_SCHEMA from env (same as src/db/dal.ts).
 */
export function initTestDal(): void {
  if (dalInitialized) return;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Create a .env file in the emailsender directory with DATABASE_URL=postgresql://user:pass@host:port/dbname",
    );
  }
  const schema = process.env.DB_SCHEMA || "emailsender";

  const config: DalConfig = {
    connectionString: url,
    schema,
    max: 5,
    statementTimeoutMs: 30000,
    applicationName: "primebrick-emailsender-test",
  };
  getDal(config);
  dalInitialized = true;
}

/**
 * Idempotent DDL — creates the sender_log table if it
 * doesn't exist. The other emailsender tables (providers, email_templates,
 * config) are created by the migration patches in db-meta/patches/.
 *
 * Column definitions match the entity snapshot (snapshot-entities.json) and
 * the SenderLogEntity decorator metadata.
 */
export async function setupTestSchema(): Promise<void> {
  initTestDal();
  const dal = getDal();
  const pool = dal.getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "emailsender"."sender_log" (
      "id" bigint generated always as identity NOT NULL,
      "entity_id" bigint,
      "entity_uuid" text,
      "type" text NOT NULL,
      "provider_message_id" text,
      "provider_uuid" uuid NOT NULL,
      "status" varchar(50) NOT NULL,
      "template_uuid" text,
      "senders" jsonb NOT NULL,
      "recipients" jsonb NOT NULL,
      "interpolated_sent_message" text,
      "error_message" text,
      "sent_at" timestamptz,
      "status_changed_at" timestamptz,
      PRIMARY KEY ("id")
    );
  `);
}

/**
 * Truncate all emailsender tables + public.service_registry between tests.
 * Uses RESTART IDENTITY CASCADE for clean state.
 */
export async function truncateTestTables(): Promise<void> {
  initTestDal();
  const dal = getDal();
  const pool = dal.getPool();

  await pool.query(`
    TRUNCATE TABLE
      "emailsender"."providers",
      "emailsender"."email_templates",
      "emailsender"."sender_log",
      "emailsender"."config",
      "public"."service_registry"
    RESTART IDENTITY CASCADE;
  `);
}

/**
 * Close the Dal gateway — call in afterAll.
 */
export async function closeTestDal(): Promise<void> {
  if (dalInitialized) {
    await resetDal();
    dalInitialized = false;
  }
}

// ─── Seed helpers ──────────────────────────────────────────────────────────

/**
 * Seed a Brevo provider row. Returns the persisted ProviderEntity.
 */
export async function seedProvider(overrides: Partial<ProviderEntity> = {}): Promise<ProviderEntity> {
  initTestDal();
  const dal = getDal();
  return dal.add<ProviderEntity>(
    ProviderEntity,
    {
      provider: "brevo",
      api_key: "test-api-key",
      api_endpoint: "http://localhost:0",
      from_email: "no-reply@example.com",
      from_name: "Test Sender",
      reply_to: null,
      ...overrides,
    },
    { actor: "test" },
  );
}

/**
 * Seed an email template row. Returns the persisted EmailTemplateEntity.
 */
export async function seedTemplate(overrides: Partial<EmailTemplateEntity> = {}): Promise<EmailTemplateEntity> {
  initTestDal();
  const dal = getDal();
  return dal.add<EmailTemplateEntity>(
    EmailTemplateEntity,
    {
      code: "WELCOME",
      language_iso: "en",
      subject: "Welcome {{name}}",
      body_html: "<b>Hello {{name}}</b>",
      body_text: "Hello {{name}}",
      mjml_source: null,
      variables: null,
      ...overrides,
    },
    { actor: "test" },
  );
}

/**
 * Find a communication log row by provider_message_id.
 */
export async function findLogByMessageId(providerMessageId: string): Promise<SenderLogEntity | null> {
  initTestDal();
  const dal = getDal();
  try {
    return await dal.find<SenderLogEntity>(SenderLogEntity, null, {
      filters: [
        Filter.fieldValue(field(SenderLogEntity, "provider_message_id"), "=", providerMessageId),
      ],
    });
  } catch {
    return null;
  }
}

// Re-export getDal for convenience in tests
export { getDal } from "@primebrick/dal-pg";
