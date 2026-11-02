/**
 * `job.job_rules` — admin-managed business event→schedule rules.
 *
 * Only BUSINESS rules live here: infrastructure jobs (partition
 * maintenance) are derived from entity metadata, never duplicated in this
 * table. When an event matching `event_subject` (+ `filter`) arrives, the
 * rules engine materializes a schedule that fires on `target_subject`.
 *
 * `target_subject` is a service-owned callable subject (e.g.
 * `emailsender.send`) picked from `census.callables`; `payload_map`
 * (PayloadMap DST) builds its request payload from the event.
 *
 * `execution_context` decides the identity the fire runs under: "user"
 * (default — the originator's AuthUser rides the forwarded headers) or
 * "system" (opt-in, declared super-partes business process with no user
 * context — a permissioned callable will deny it).
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

@Entity("job_rules", "job")
export class JobRuleEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  id!: bigint;

  @Unique()
  uuid!: UUID;

  @Unique()
  @Column({ length: 200, nullable: false })
  name!: string;

  /** Event subject to subscribe, e.g. "customer.updated". */
  @Column({ nullable: false })
  event_subject!: string;

  /** JSON filter — array of { field, op, value } evaluated on the event payload. */
  @Column({ nullable: true })
  filter?: unknown;

  /** Schedule spec materialized on match — "@every 1d", "@at …", cron. */
  @Column({ nullable: false })
  schedule_spec!: string;

  /** Due target — a callable subject from census.callables (e.g.
   *  emailsender.send), or a legacy jobs.due.<lane>.* subject. */
  @Column({ nullable: false })
  target_subject!: string;

  /** Rule-owned payload map — `PayloadMap` DST from @primebrick/core:
   *  per target field, a {kind:"const"|"path"|"meta"} entry resolved
   *  against the event payload at arm time. NULL/{} = verbatim forward. */
  @Column({ nullable: true })
  payload_map?: unknown;

  /** user (default) | system — explicit opt-in, never inferred. */
  @Column({ length: 10, nullable: false })
  execution_context!: string;

  @Column({ nullable: false })
  enabled!: boolean;







}
