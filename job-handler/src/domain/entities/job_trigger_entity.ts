/**
 * `job.job_triggers` — admin-managed business trigger declarations.
 *
 * Only BUSINESS triggers live here: infrastructure jobs (partition
 * maintenance) are derived from entity metadata, never duplicated in this
 * table. A trigger binds an optional event source and/or an optional
 * schedule to a callable target:
 *
 *   event + schedule → event-gated timer (match arms, non-match disarms)
 *   event only       → immediate dispatch on match (no JetStream schedule)
 *   schedule only    → pure timer, always armed (absorbs ex-"manual")
 *
 * `event_subject`/`schedule_spec` are mutually mandatory — at least one
 * must be set (enforced in code, both nullable at rest).
 *
 * `target_subject` is a service-owned callable subject (e.g.
 * `emailsender.send`) picked from `census.callables`; `payload_map`
 * (PayloadMap DST) builds its request payload from the event.
 *
 * `execution_context` decides the identity the fire runs under: "user"
 * (the originator's AuthUser rides the event's forwarded headers — only
 * meaningful when an event source exists), "me" (the trigger author's
 * AuthUser, resolved via `auth.ctl.resolve_user` at arm time) or "system"
 * (opt-in, declared super-partes business process with no user context —
 * a permissioned callable will deny it).
 */
import {
  Entity,
  Key,
  Unique,
  Column,
  type UUID,
  EntityBase,
  Auditable,
  Deletable,
} from "@primebrick/dal-pg";

@Entity("job_triggers", "job")
export class JobTriggerEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  id!: bigint;

  @Unique()
  uuid!: UUID;

  @Unique()
  @Column({ length: 200, nullable: false })
  name!: string;

  /** Event subject to subscribe, e.g. "customer.updated". NULL when the
   *  trigger is schedule-only. */
  @Column({ nullable: true })
  event_subject?: string;

  /** JSON filter — array of { field, op, value } evaluated on the event payload. */
  @Column({ nullable: true })
  filter?: unknown;

  /** Schedule spec — "@every 1d", "@at …", cron. On event+schedule
   *  triggers it is materialized on match; on schedule-only triggers it
   *  arms directly. NULL for immediate (event-only) triggers. */
  @Column({ nullable: true })
  schedule_spec?: string;

  /** Due target — a callable subject from census.callables (e.g.
   *  emailsender.send), or a legacy jobs.due.<lane>.* subject. */
  @Column({ nullable: false })
  target_subject!: string;

  /** Trigger-owned payload map — `PayloadMap` DST from @primebrick/core:
   *  per target field, a {kind:"const"|"path"|"meta"} entry resolved
   *  against the event payload at arm/fire time. NULL/{} = verbatim forward. */
  @Column({ nullable: true })
  payload_map?: unknown;

  /** user | me | system — explicit opt-in, never inferred. */
  @Column({ length: 10, nullable: false })
  execution_context!: string;

  @Column({ nullable: false })
  enabled!: boolean;
}
