/**
 * Conversation and message persistence.
 *
 * Uses raw SQL on the public.ai_conversations and public.ai_messages tables
 * (created by the BE's init_database.sql patch). These tables are shared with
 * the BE for MCP entity registry access.
 */
import { getDal } from "../db/dal.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConversationRow {
  uuid: string;
  user_uuid: string;
  title: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MessageRow {
  uuid: string;
  conversation_uuid: string;
  role: string;
  content: unknown;
  tokens_in: number | null;
  tokens_out: number | null;
  created_at: Date;
}

// ─── Conversations ───────────────────────────────────────────────────────────

export async function createConversation(opts: {
  user_uuid: string;
  title?: string;
}): Promise<ConversationRow> {
  const pool = getDal().getPool();
  const result = await pool.query<ConversationRow>(
    `INSERT INTO ai_conversations (user_uuid, title)
     VALUES ($1, $2)
     RETURNING uuid, user_uuid, title, created_at, updated_at`,
    [opts.user_uuid, opts.title ?? null],
  );
  return result.rows[0];
}

export async function getConversation(uuid: string, userUuid: string): Promise<ConversationRow | null> {
  const pool = getDal().getPool();
  const result = await pool.query<ConversationRow>(
    `SELECT uuid, user_uuid, title, created_at, updated_at
     FROM ai_conversations
     WHERE uuid = $1 AND user_uuid = $2`,
    [uuid, userUuid],
  );
  return result.rows[0] ?? null;
}

export async function listConversations(userUuid: string, limit: number = 50): Promise<ConversationRow[]> {
  const pool = getDal().getPool();
  const result = await pool.query<ConversationRow>(
    `SELECT uuid, user_uuid, title, created_at, updated_at
     FROM ai_conversations
     WHERE user_uuid = $1
     ORDER BY updated_at DESC
     LIMIT $2`,
    [userUuid, limit],
  );
  return result.rows;
}

export async function touchConversation(uuid: string): Promise<void> {
  const pool = getDal().getPool();
  await pool.query(
    `UPDATE ai_conversations SET updated_at = now() WHERE uuid = $1`,
    [uuid],
  );
}

export async function updateConversationTitle(uuid: string, title: string): Promise<void> {
  const pool = getDal().getPool();
  await pool.query(
    `UPDATE ai_conversations SET title = $1, updated_at = now() WHERE uuid = $2`,
    [title, uuid],
  );
}

export async function deleteConversation(uuid: string, userUuid: string): Promise<void> {
  const pool = getDal().getPool();
  await pool.query(
    `DELETE FROM ai_conversations WHERE uuid = $1 AND user_uuid = $2`,
    [uuid, userUuid],
  );
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function insertMessage(opts: {
  conversation_uuid: string;
  role: string;
  content: unknown;
  tokens_in?: number;
  tokens_out?: number;
}): Promise<MessageRow> {
  const pool = getDal().getPool();
  const result = await pool.query<MessageRow>(
    `INSERT INTO ai_messages (conversation_uuid, role, content, tokens_in, tokens_out)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING uuid, conversation_uuid, role, content, tokens_in, tokens_out, created_at`,
    [
      opts.conversation_uuid,
      opts.role,
      JSON.stringify(opts.content),
      opts.tokens_in ?? null,
      opts.tokens_out ?? null,
    ],
  );
  await touchConversation(opts.conversation_uuid);
  return result.rows[0];
}

export async function listMessages(conversationUuid: string): Promise<MessageRow[]> {
  const pool = getDal().getPool();
  const result = await pool.query<MessageRow>(
    `SELECT uuid, conversation_uuid, role, content, tokens_in, tokens_out, created_at
     FROM ai_messages
     WHERE conversation_uuid = $1
     ORDER BY created_at ASC`,
    [conversationUuid],
  );
  return result.rows;
}
