/**
 * Conversation and message persistence.
 *
 * Standard DAL entities (`AiConversationEntity` / `AiMessageEntity`,
 * `ai` schema) — no raw SQL. All tables are `IAuditableEntity` without an
 * audit trail: the writer's identity is stamped by `add`/`update` via
 * `{ actor }` into `created_by`/`updated_by` — that IS the owner column
 * (the former `user_uuid` domain column was a duplicate of it).
 *
 * Concurrency contract: `version` is supplied by the CALLER (the
 * event-sourcing wire standard — the FE/NATS payload carries it, the
 * route validates `?version=` like every entity write). The repository
 * never re-reads the row to obtain a version — that would defeat the
 * optimistic lock it exists to provide.
 *
 * Atomicity: a conversation is an indivisible unit — child rows are
 * never deleted alone. `insertMessage`/`insertFeedback` stamp the
 * parent's `last_seen_at` watermark inside `dal.beginTransaction()` —
 * ONE data-modifying CTE statement where the child's `created_at`
 * flows into the parent `update` via `Deferred.ref()` (the row IS
 * auditable — the optimistic lock applies to bookkeeping writes too;
 * a message insert bumps `version`, so a caller holding a pre-message
 * version for a title edit must re-read — that is the honest
 * contract, `touch` was removed because it bypassed it);
 * `deleteConversation` hard-deletes feedback + messages +
 * conversation in one `dal.transaction` — the cascade reads child
 * identity mid-flow, the legitimate case for the callback form.
 * No DB-level FK exists (impossible on a partitioned parent) — the
 * cascade below IS the referential integrity.
 */
import { getDal } from "../db/dal.js";
import { field, Filter, Project, Sort } from "@primebrick/dal-pg";
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
  version: number;
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

// ─── Conversations ───────────────────────────────────────────────────────────

export async function createConversation(opts: {
  actor: string;
  title?: string;
}): Promise<ConversationRow> {
  // last_seen_at starts at creation — it is the partition key and must
  // never be NULL; it means "no child events yet, only the create".
  return await getDal().add(AiConversationEntity, {
    title: opts.title,
    last_seen_at: new Date(),
  }, { actor: opts.actor }) as ConversationRow;
}

export async function getConversation(uuid: string, actor: string): Promise<ConversationRow | null> {
  const row = await getDal().find(AiConversationEntity, CONV_FIELDS.map((k) => ({ kind: "field" as const, field: field(AiConversationEntity, k) })), {
    filters: [
      Filter.fieldValue(field(AiConversationEntity, "uuid"), "=", uuid),
      Filter.fieldValue(field(AiConversationEntity, "created_by"), "=", actor),
    ],
    throwIfNotFound: false,
  });
  return (row as ConversationRow | null) ?? null;
}

export async function listConversations(actor: string, limit: number = 50): Promise<ConversationRow[]> {
  const page = await getDal().findByPage(AiConversationEntity, 1, limit, CONV_FIELDS.map((k) => ({ kind: "field" as const, field: field(AiConversationEntity, k) })), {
    filters: [Filter.fieldValue(field(AiConversationEntity, "created_by"), "=", actor)],
    // Activity ordering: the watermark, not the audit stamp.
    sorting: [Sort.by(field(AiConversationEntity, "last_seen_at"), "DESC")],
  });
  return page.entities as ConversationRow[];
}

/**
 * Read the parent row fresh (version + watermark) for a deferred-tx stamp.
 * The version feeds `update`'s optimistic guard inside the single
 * statement — a concurrent writer aborts the whole commit with ERR01 and
 * the caller retries. Never reach for `version` without this read.
 */
async function readConversationForStamp(conversationUuid: string) {
  const conv = await getDal().findByUUID<AiConversationEntity>(AiConversationEntity, conversationUuid);
  if (!conv) throw new Error(`Conversation ${conversationUuid} not found`);
  return conv;
}

/**
 * Run `build(tx)` as ONE deferred statement, retrying on ERR01 (optimistic
 * conflict on the parent stamp under concurrent child events). Each
 * attempt re-reads the parent version and re-buffers — `Deferred` handles
 * are single-shot, never reused across attempts.
 */
export async function commitStamped<T>(
  conversationUuid: string | undefined,
  build: (tx: ReturnType<ReturnType<typeof getDal>["beginTransaction"]>, convVersion?: number) => { result: { value: T } },
): Promise<T> {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 0; ; attempt++) {
    const conv = conversationUuid ? await readConversationForStamp(conversationUuid) : undefined;
    const tx = getDal().beginTransaction();
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

export async function updateConversationTitle(uuid: string, title: string, version: number, actor: string): Promise<void> {
  await getDal().update(AiConversationEntity, { uuid, version, title }, { actor });
}

export async function deleteConversation(uuid: string, version: number, actor: string): Promise<void> {
  // Physical cascade — conversations are auditable but NOT deletable
  // (no @DeletableField) → `hardDelete` is the physical path. Children
  // (feedback, then messages) die in the SAME transaction: a conversation
  // is atomic, partial deletes are not a state. No DB FK exists on the
  // partitioned parent — this transaction IS the referential integrity.
  await getDal().transaction(async (repo) => {
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

// ─── Messages ────────────────────────────────────────────────────────────────

export async function insertMessage(opts: {
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
  return await commitStamped(opts.conversation_uuid, (tx, convVersion) => {
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

export async function listMessages(conversationUuid: string): Promise<MessageRow[]> {
  return await getDal().findAll(AiMessageEntity, MSG_FIELDS.map((k) => ({ kind: "field" as const, field: field(AiMessageEntity, k) })), {
    filters: [Filter.fieldValue(field(AiMessageEntity, "conversation_uuid"), "=", conversationUuid)],
    sorting: [Sort.by(field(AiMessageEntity, "created_at"), "ASC")],
  }) as MessageRow[];
}
