/**
 * ConversationsService — `ai_conversations` / `ai_messages` persistence on
 * `DomainService` (was `conversation-repository.ts`).
 *
 * Standard DAL entities (`AiConversationEntity` / `AiMessageEntity`,
 * `ai` schema) — no raw SQL. Both are `IAuditableEntity` without an
 * audit trail: the writer's identity is stamped via `created_by`/
 * `updated_by` — that IS the owner column.
 *
 * Write surfaces:
 *   - `svc` writes (`createConversation`, `updateConversationTitle`)
 *     resolve the actor from ALS — callers pass `actor` explicitly and
 *     the method wraps `runWithSession(actorSession(actor))`.
 *   - `commitStamped`/`insertMessage`/`deleteConversation` stay on the
 *     declared tx seams (`svc.beginTransaction()` / `svc.transaction`):
 *     `ref()`-bound watermarks and the 3-entity cascade CANNOT be
 *     expressed through svc — repo ops inside the tx carry the actor
 *     explicitly (the sanctioned seam contract).
 *
 * Concurrency contract: `version` is supplied by the CALLER (the
 * event-sourcing wire standard — the FE/NATS payload carries it, the
 * route validates `?version=` like every entity write). The service
 * never re-reads the row to obtain a version — that would defeat the
 * optimistic lock it exists to provide.
 *
 * Atomicity: a conversation is an indivisible unit — child rows are
 * never deleted alone. `insertMessage`/`insertFeedback` stamp the
 * parent's `last_seen_at` watermark inside `beginTransaction()` —
 * ONE data-modifying CTE statement where the child's `created_at`
 * flows into the parent `update` via `Deferred.ref()` (the row IS
 * auditable — the optimistic lock applies to bookkeeping writes too;
 * a message insert bumps `version`, so a caller holding a pre-message
 * version for a title edit must re-read — that is the honest
 * contract, `touch` was removed because it bypassed it);
 * `deleteConversation` hard-deletes feedback + messages +
 * conversation in one `transaction` — the cascade reads child
 * identity mid-flow, the legitimate case for the callback form.
 * No DB-level FK exists (impossible on a partitioned parent) — the
 * cascade below IS the referential integrity.
 */
import { DomainService, field, Filter, Project, Sort, type DeferredTransaction } from "@primebrick/dal-pg";
import { runWithSession } from "@primebrick/sdk";
import { actorSession, entityActor } from "../db/entity-repo.js";
import { AiConversationEntity } from "../domain/entities/ai_conversation_entity.js";
import { AiMessageEntity } from "../domain/entities/ai_message_entity.js";
import { AiFeedbackEntity } from "../domain/entities/ai_feedback_entity.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConversationRow {
  uuid: string;
  /** Conversation owner — the DAL-stamped `created_by` (session user uuid). */
  created_by: string;
  title: string | null;
  last_seen_at: Date;
  created_at: Date;
  updated_at: Date;
  version: bigint;
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

const CONV_FIELDS = ["uuid", "created_by", "title", "last_seen_at", "created_at", "updated_at", "version"] as const;
const MSG_FIELDS = ["uuid", "conversation_uuid", "role", "content", "tokens_in", "tokens_out", "created_at"] as const;

type DeferredTx = DeferredTransaction;

type ConversationsT = AiConversationEntity & Record<string, unknown>;

export class ConversationsService extends DomainService<ConversationsT> {
  constructor() {
    super({
      entity: AiConversationEntity as never,
      actor: entityActor,
      // Conversations are RPC-served, not meta-served.
      list: { searchableKeys: [], filterableKeys: new Set(["created_by"]) },
    });
  }

  // ─── Conversations ────────────────────────────────────────────────────────

  async createConversation(opts: {
    actor: string;
    title?: string;
  }): Promise<ConversationRow> {
    // last_seen_at starts at creation — it is the partition key and must
    // never be NULL; it means "no child events yet, only the create".
    return await runWithSession(actorSession(opts.actor), () =>
      this.svc.create({
        title: opts.title,
      }) as Promise<ConversationRow>);
  }

  async getConversation(uuid: string, actor: string): Promise<ConversationRow | null> {
    return this.svc.find<ConversationRow>(CONV_FIELDS.map((k) => ({ kind: "field" as const, field: field(AiConversationEntity, k) })), {
      filters: [
        Filter.fieldValue(field(AiConversationEntity, "uuid"), "=", uuid),
        Filter.fieldValue(field(AiConversationEntity, "created_by"), "=", actor),
      ],
      throwIfNotFound: false,
    });
  }

  async listConversations(actor: string, limit: number = 50): Promise<ConversationRow[]> {
    const r = await this.svc.list({
      filters: [{ field: "created_by", op: "=", value: actor }],
      // Activity ordering: the watermark, not the audit stamp.
      sort_key: "last_seen_at",
      sort_dir: "desc",
      page: 1,
      page_size: limit,
    });
    return r.rows as unknown as ConversationRow[];
  }

  /**
   * Read the parent row fresh (version + watermark) for a deferred-tx stamp.
   * The version feeds `update`'s optimistic guard inside the single
   * statement — a concurrent writer aborts the whole commit with ERR01 and
   * the caller retries. Never reach for `version` without this read.
   */
  private async readConversationForStamp(conversationUuid: string) {
    return await this.svc.get(conversationUuid);
  }

  /**
   * Run `build(tx)` as ONE deferred statement, retrying on ERR01 (optimistic
   * conflict on the parent stamp under concurrent child events). Each
   * attempt re-reads the parent version and re-buffers — `Deferred` handles
   * are single-shot, never reused across attempts.
   * DECLARED TX SEAM: ref()-bound cross-entity writes cannot go through
   * svc — repo ops inside carry `{ actor }` explicitly.
   */
  async commitStamped<T>(
    conversationUuid: string | undefined,
    build: (tx: DeferredTx, convVersion?: bigint) => { result: { value: T } },
  ): Promise<T> {
    const MAX_ATTEMPTS = 3;
    for (let attempt = 0; ; attempt++) {
      const conv = conversationUuid ? await this.readConversationForStamp(conversationUuid) : undefined;
      const tx = this.svc.beginTransaction();
      const { result } = build(tx, conv?.version);
      try {
        await tx.commit();
        return result.value;
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code !== "ERR01" || attempt >= MAX_ATTEMPTS - 1) throw err;
      }
    }
  }

  async updateConversationTitle(uuid: string, title: string, version: bigint, actor: string): Promise<void> {
    await runWithSession(actorSession(actor), () =>
      this.svc.update(uuid, { version, title }));
  }

  async deleteConversation(uuid: string, version: bigint, actor: string): Promise<void> {
    // Physical cascade — conversations are auditable but NOT deletable
    // (no @DeletableField) → `hardDelete` is the physical path. Children
    // (feedback, then messages) die in the SAME transaction: a conversation
    // is atomic, partial deletes are not a state. No DB FK exists on the
    // partitioned parent — this transaction IS the referential integrity.
    // DECLARED TX SEAM: 3-entity cascade — svc cannot express it; repo ops
    // carry `{ actor }` explicitly.
    await this.svc.transaction(async (repo) => {
      const feedback = await repo.findAll(AiFeedbackEntity, [
        Project.field(field(AiFeedbackEntity, "uuid")),
        Project.field(field(AiFeedbackEntity, "version")),
      ], {
        filters: [Filter.fieldValue(field(AiFeedbackEntity, "conversation_uuid"), "=", uuid)],
      }) as { uuid: string; version: number }[];
      for (const f of feedback) {
        await repo.hardDelete(AiFeedbackEntity, { uuid: f.uuid, version: f.version }, { actor });
      }
      const msgs = await repo.findAll(AiMessageEntity, [
        Project.field(field(AiMessageEntity, "uuid")),
        Project.field(field(AiMessageEntity, "version")),
      ], {
        filters: [Filter.fieldValue(field(AiMessageEntity, "conversation_uuid"), "=", uuid)],
      }) as { uuid: string; version: number }[];
      for (const m of msgs) {
        await repo.hardDelete(AiMessageEntity, { uuid: m.uuid, version: m.version }, { actor });
      }
      await repo.hardDelete(AiConversationEntity, { uuid, version }, { actor });
    });
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  async insertMessage(opts: {
    conversation_uuid: string;
    role: string;
    content: unknown;
    tokens_in?: number;
    tokens_out?: number;
    actor: string;
  }): Promise<MessageRow> {
    // Message insert + parent watermark stamp are ONE deferred statement —
    // `last_seen_at` is bound server-side to the insert's RETURNING via ref()
    // (the activity clock can never drift from the rows that justify it).
    // Concurrent child events serialize on the parent's optimistic version —
    // a loser aborts with ERR01 and retries on a fresh version.
    return await this.commitStamped(opts.conversation_uuid, (tx, convVersion) => {
      const msg = tx.add(AiMessageEntity, {
        conversation_uuid: opts.conversation_uuid,
        role: opts.role,
        content: opts.content,
        tokens_in: opts.tokens_in,
        tokens_out: opts.tokens_out,
      }, { actor: opts.actor });
      tx.update(AiConversationEntity, {
        uuid: opts.conversation_uuid,
        version: convVersion!,
        last_seen_at: msg.ref("created_at"),
      }, { actor: opts.actor });
      return { result: msg as unknown as { value: MessageRow } };
    });
  }

  async listMessages(conversationUuid: string): Promise<MessageRow[]> {
    return await this.svcFor(AiMessageEntity).query<MessageRow>(MSG_FIELDS.map((k) => ({ kind: "field" as const, field: field(AiMessageEntity, k) })), {
      filters: [Filter.fieldValue(field(AiMessageEntity, "conversation_uuid"), "=", conversationUuid)],
      sorting: [Sort.by(field(AiMessageEntity, "created_at"), "ASC")],
    });
  }
}
