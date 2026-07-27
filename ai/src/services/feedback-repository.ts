/**
 * Feedback persistence — user thumbs up/down on AI assistant messages.
 *
 * Uses raw SQL on the public.ai_feedback table (created by the BE's
 * init_database.sql patch). Follows the same pattern as conversation-repository.ts.
 */
import { getDal } from "../db/dal.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FeedbackRow {
  uuid: string;
  message_uuid: string;
  conversation_uuid: string | null;
  user_uuid: string;
  rating: "up" | "down";
  comment: string | null;
  created_at: Date;
}

// ─── Repository ──────────────────────────────────────────────────────────────

export async function insertFeedback(opts: {
  message_uuid: string;
  conversation_uuid?: string;
  user_uuid: string;
  rating: "up" | "down";
  comment?: string;
}): Promise<FeedbackRow> {
  const pool = getDal().getPool();
  const result = await pool.query<FeedbackRow>(
    `INSERT INTO ai_feedback (message_uuid, conversation_uuid, user_uuid, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING uuid, message_uuid, conversation_uuid, user_uuid, rating, comment, created_at`,
    [
      opts.message_uuid,
      opts.conversation_uuid ?? null,
      opts.user_uuid,
      opts.rating,
      opts.comment ?? null,
    ],
  );
  return result.rows[0]!;
}

export async function getFeedbackByMessage(
  messageUuid: string,
  userUuid: string,
): Promise<FeedbackRow | null> {
  const pool = getDal().getPool();
  const result = await pool.query<FeedbackRow>(
    `SELECT uuid, message_uuid, conversation_uuid, user_uuid, rating, comment, created_at
     FROM ai_feedback
     WHERE message_uuid = $1 AND user_uuid = $2
     LIMIT 1`,
    [messageUuid, userUuid],
  );
  return result.rows[0] ?? null;
}

export async function listFeedbackByUser(
  userUuid: string,
  limit: number = 50,
): Promise<FeedbackRow[]> {
  const pool = getDal().getPool();
  const result = await pool.query<FeedbackRow>(
    `SELECT uuid, message_uuid, conversation_uuid, user_uuid, rating, comment, created_at
     FROM ai_feedback
     WHERE user_uuid = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userUuid, limit],
  );
  return result.rows;
}

export async function getFeedbackStats(): Promise<{
  total: bigint;
  up: bigint;
  down: bigint;
}> {
  const pool = getDal().getPool();
  const result = await pool.query<{
    total: string;
    up: string;
    down: string;
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE rating = 'up')::text AS up,
       COUNT(*) FILTER (WHERE rating = 'down')::text AS down
     FROM ai_feedback`,
  );
  const row = result.rows[0]!;
  return {
    total: BigInt(row.total ?? 0),
    up: BigInt(row.up ?? 0),
    down: BigInt(row.down ?? 0),
  };
}
