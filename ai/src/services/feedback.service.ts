/**
 * FeedbackService — `ai_feedback` persistence on `DomainService`
 * (was `feedback-repository.ts`). User thumbs up/down on AI assistant
 * messages.
 *
 * Standard DAL entity (`AiFeedbackEntity`, `ai` schema) — no raw SQL.
 * `IAuditableEntity` without audit trail: `created_by` IS the voter —
 * it replaced the former `user_uuid` domain column.
 *
 * `insertFeedback` stays on the declared tx seam via
 * `ConversationsService.commitStamped` — the parent's `last_seen_at`
 * watermark binds server-side to the insert's RETURNING via `ref()`,
 * a primitive svc cannot express; repo ops inside the tx carry
 * `{ actor }` explicitly.
 */
import { DomainService, field, Filter, Project, Sort } from "@primebrick/dal-pg";
import { AiConversationEntity } from "../domain/entities/ai_conversation_entity.js";
import { AiFeedbackEntity } from "../domain/entities/ai_feedback_entity.js";
import { entityActor } from "../db/entity-repo.js";
import { ConversationsService } from "./conversations.service.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FeedbackRow {
  uuid: string;
  message_uuid: string;
  conversation_uuid: string | null;
  /** Voter — the DAL-stamped `created_by` (session user uuid). */
  created_by: string;
  rating: "up" | "down";
  comment: string | null;
  created_at: Date;
}

const FB_FIELDS = (["uuid", "message_uuid", "conversation_uuid", "created_by", "rating", "comment", "created_at"] as const)
  .map((k) => Project.field(field(AiFeedbackEntity, k)));

type FeedbackT = AiFeedbackEntity & Record<string, unknown>;

export class FeedbackService extends DomainService<FeedbackT> {
  constructor(private readonly conversations = new ConversationsService()) {
    super({
      entity: AiFeedbackEntity as never,
      actor: entityActor,
      // Feedback is RPC-served, not meta-served.
      list: { searchableKeys: [], filterableKeys: new Set() },
    });
  }

  async insertFeedback(opts: {
    message_uuid: string;
    conversation_uuid?: string;
    actor: string;
    rating: "up" | "down";
    comment?: string;
  }): Promise<FeedbackRow> {
    // Feedback is a child event of the conversation — the row and the
    // parent's `last_seen_at` watermark commit as ONE deferred statement
    // (`ref()` binds the watermark server-side to the insert's RETURNING;
    // concurrent child events serialize on the parent's version, ERR01
    // losers retry on a fresh read).
    return await this.conversations.commitStamped(opts.conversation_uuid, (tx, convVersion) => {
      const fb = tx.add(AiFeedbackEntity, {
        message_uuid: opts.message_uuid,
        conversation_uuid: opts.conversation_uuid,
        rating: opts.rating,
        comment: opts.comment,
      }, { actor: opts.actor });
      if (opts.conversation_uuid) {
        tx.update(AiConversationEntity, {
          uuid: opts.conversation_uuid,
          version: convVersion!,
          last_seen_at: fb.ref("created_at"),
        }, { actor: opts.actor });
      }
      return { result: fb as unknown as { value: FeedbackRow } };
    });
  }

  async getFeedbackByMessage(
    messageUuid: string,
    actor: string,
  ): Promise<FeedbackRow | null> {
    const row = await this.dal.find(AiFeedbackEntity, FB_FIELDS, {
      filters: [
        Filter.fieldValue(field(AiFeedbackEntity, "message_uuid"), "=", messageUuid),
        Filter.fieldValue(field(AiFeedbackEntity, "created_by"), "=", actor),
      ],
      throwIfNotFound: false,
    });
    return (row as FeedbackRow | null) ?? null;
  }

  async listFeedbackByUser(
    actor: string,
    limit: number = 50,
  ): Promise<FeedbackRow[]> {
    const page = await this.dal.findByPage(AiFeedbackEntity, 1, limit, FB_FIELDS, {
      filters: [Filter.fieldValue(field(AiFeedbackEntity, "created_by"), "=", actor)],
      sorting: [Sort.by(field(AiFeedbackEntity, "created_at"), "DESC")],
    });
    return page.entities as FeedbackRow[];
  }

  async getFeedbackStats(): Promise<{
    total: bigint;
    up: bigint;
    down: bigint;
  }> {
    const rows = await this.dal.findAll(AiFeedbackEntity, [
      Project.expr("COUNT(*)", "total"),
      Project.expr("COUNT(*) FILTER (WHERE rating = 'up')", "up"),
      Project.expr("COUNT(*) FILTER (WHERE rating = 'down')", "down"),
    ]);
    const row = (rows as { total: bigint; up: bigint; down: bigint }[])[0]!;
    return { total: row.total, up: row.up, down: row.down };
  }
}
