/**
 * nats-sub controller — the governed system-trigger materialization endpoint.
 *
 *   jobs.ctl.triggers.materialize  (callNats request/reply over correlation)
 *
 * The ONLY way a module turns its code-declared system jobs into
 * `job.job_triggers` rows. L1 client shield plus an explicit caller-
 * namespace check: a service may only materialize jobs keyed inside its
 * own `<svc>.` namespace, and a target outside its namespace must be a
 * real declared callable (census.callables) — a module can never
 * materialize a trigger that fires into someone else's contract.
 * Lives on `jobs.ctl.*` (NOT a stream subject) — same swallowing rule
 * as the schedule-request routes.
 */

import {
  makeNatsRequestRoute,
  serviceLaneVerify,
  scheduleSpecError,
  jobTriggerShapeIssues,
  MIN_SCHEDULE_INTERVAL_MS,
  logger,
} from "@primebrick/sdk";
import { callerServiceCode } from "../../services/schedule-service.js";
import { callableSubjects } from "../../services/callable-catalog.js";
import { materializeSystemJobs, type SystemJobDecl } from "../../services/system-triggers.js";
import { ScheduleDeclarationError } from "../../services/schedule-service.js";

const RUN_AS = new Set(["originator", "author", "system"]);

function validateMaterialize(raw: unknown): { jobs: SystemJobDecl[] } {
  const r = raw as { jobs?: unknown };
  if (!Array.isArray(r?.jobs)) {
    throw new ScheduleDeclarationError("VALIDATION_ERROR", "jobs must be an array");
  }
  for (const j of r.jobs as Record<string, unknown>[]) {
    if (typeof j?.key !== "string" || !/^[a-z0-9_][a-z0-9_.-]*$/.test(j.key)) {
      throw new ScheduleDeclarationError(
        "VALIDATION_ERROR",
        `job key "${String(j?.key)}" must match ^[a-z0-9_][a-z0-9_.-]*$`,
      );
    }
    if (typeof j?.name !== "string" || !j.name) {
      throw new ScheduleDeclarationError("VALIDATION_ERROR", `job "${j.key}" requires name`);
    }
    if (typeof j?.target_subject !== "string" || !j.target_subject) {
      throw new ScheduleDeclarationError("VALIDATION_ERROR", `job "${j.key}" requires target_subject`);
    }
    if (typeof j?.run_as !== "string" || !RUN_AS.has(j.run_as)) {
      throw new ScheduleDeclarationError(
        "VALIDATION_ERROR",
        `job "${j.key}" run_as must be originator|author|system`,
      );
    }
    if (j.schedule_spec !== undefined && j.schedule_spec !== null) {
      const specErr = scheduleSpecError(j.schedule_spec);
      if (specErr === "below_min_interval") {
        throw new ScheduleDeclarationError(
          "SCHEDULE_BELOW_MIN_INTERVAL",
          `job "${j.key}" schedule "${String(j.schedule_spec)}" fires below the ${MIN_SCHEDULE_INTERVAL_MS / 1000}s minimum`,
        );
      }
      if (specErr) {
        throw new ScheduleDeclarationError(
          "VALIDATION_ERROR",
          `job "${j.key}" invalid schedule_spec "${String(j.schedule_spec)}"`,
        );
      }
    }
    // The same closed shape predicate the CRUD path runs — a decl that
    // could never be a legal trigger (no source AND no schedule,
    // originator without a source) is a code bug, rejected loudly.
    const issues = jobTriggerShapeIssues(j as Record<string, unknown>);
    if (issues.length > 0) {
      throw new ScheduleDeclarationError(
        "VALIDATION_ERROR",
        `job "${j.key}" — ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
      );
    }
  }
  return r as { jobs: SystemJobDecl[] };
}

export async function registerSystemTriggerRoutes(): Promise<void> {
  await makeNatsRequestRoute(
    [
      {
        subject: "jobs.ctl.triggers.materialize",
        permissions: [], // `verify` replaces the user chain — service-only endpoint
        verify: serviceLaneVerify,
        validate: validateMaterialize,
        handler: async ({ request, msg }) => {
          const caller = callerServiceCode(msg.headers?.get("user-agent") ?? undefined);
          const { jobs } = request as { jobs: SystemJobDecl[] };
          const callables = await callableSubjects();
          for (const j of jobs) {
            if (!j.key.startsWith(`${caller}.`)) {
              throw new ScheduleDeclarationError(
                "FOREIGN_NAMESPACE",
                `service "${caller}" cannot materialize "${j.key}" — keys live inside the caller's namespace`,
              );
            }
            if (!j.target_subject.startsWith(`${caller}.`) && !callables.has(j.target_subject)) {
              throw new ScheduleDeclarationError(
                "FOREIGN_NAMESPACE",
                `job "${j.key}" target "${j.target_subject}" is neither in the caller's namespace nor a declared callable`,
              );
            }
          }
          return { results: await materializeSystemJobs(caller, jobs) };
        },
      } as const,
    ],
    { serviceCode: "job" },
  );

  logger.done("nats route registered: jobs.ctl.triggers.materialize", { tags: ["jobs"] });
}
