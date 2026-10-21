import "dotenv/config";
import "reflect-metadata";
import { join } from "node:path";
import {
  createMicroservice,
  logger,
  pgServerBanner,
  NatsClient,
} from "@primebrick/sdk";
import * as dalMigrations from "@primebrick/dal-pg";
import { initDal, getDal } from "./db/dal.js";
import { ENTITY_REGISTRY } from "./domain/entities/registry.js";
import { ConfigRepositoryAdapter } from "./adapters/config-repository-adapter.js";
import { HealthCheckAdapter } from "./adapters/health-check-adapter.js";
import { JobAuthConfigPort } from "./adapters/auth-ports-adapter.js";
import { jobEntityRouteHandler } from "./controllers/http/entities-route.js";
import { jobActionsRouteHandler } from "./controllers/http/actions-route.js";
import { moduleAssetsRouteHandler } from "./controllers/http/module-assets-route.js";
import { composeRouteHandlers, assertDbEnv } from "@primebrick/sdk";
import { registerScheduleRoutes } from "./controllers/nats-sub/schedule-request.js";
import { startRunRecorder, JOBS_STREAM } from "./services/run-recorder.js";
import { startRulesEngine } from "./services/rules-engine.js";

async function main(): Promise<void> {
  await createMicroservice({
    serviceName: "job",
    serviceDisplayName: "Job Handler",
    serviceDescription:
      "Jobs orchestration — sole writer of jobs.schedule.*, rules engine over job_rules, run-history tap on jobs.result.>",
    icon: "list-clock",
    iconType: "icon",

    // Root level — this module is part of the `system` level: its FE route
    // prefix is derived as `/{part_of}/{code}` = /system/job (validated at
    // registration; the prefix is never free-chosen).
    partOf: "system",

    // Module display-name key — resolved against this service's own
    // `job.translations` namespace by every UI surface (launcher,
    // breadcrumbs, module menus); fallback: raw registry `name`.
    labelKey: "job.module.name",

    // Module self-declaration — persisted in service_registry.endpoints.nav.
    // The job module OWNS /system/job: nav links, route census entries and
    // the remote chunk URL are published by this service, never hardcoded
    // inside another module's nav registry.
    nav: {
      route_prefixes: ["/system/job"],
      nav: [
        { id: "jobs", label_key: "job.jobs.nav", href: "/system/job", icon: "list-clock" },
        { id: "runs", label_key: "job.jobs.nav_runs", href: "/system/job/runs", icon: "play" },
        { id: "rules", label_key: "job.jobs.nav_rules", href: "/system/job/rules", icon: "list-checks" },
      ],
      routes: [
        // Host-rendered EntityTablePage lists — the standard archetype,
        // delivered statically by the FE; the service declares ownership.
        { route: "/system/job", kind: "list", entity: "job_schedule", label_key: "job.jobs.nav" },
        { route: "/system/job/runs", kind: "list", entity: "job_run", label_key: "job.jobs.nav_runs" },
        { route: "/system/job/rules", kind: "list", entity: "job_rule", label_key: "job.jobs.nav_rules" },
        // The custom surfaces: manual schedule creation (its form composes
        // schedule_subject/target — not a plain entity form) and rule
        // creation (event subject → filter → schedule workflow). Both ride
        // the same esm-mount chunk, which dispatches on ctx.nav.route.
        {
          route: "/system/job/new",
          kind: "create",
          entity: "job_schedule",
          label_key: "job.jobs.scheduleNew",
          icon: "calendar-plus",
          component_url: "/ws/job/api/v1/module-assets/jobs-page.js",
          component_format: "esm-mount",
        },
        {
          route: "/system/job/rules/new",
          kind: "create",
          entity: "job_rule",
          label_key: "job.jobs.ruleForm.title",
          component_url: "/ws/job/api/v1/module-assets/jobs-page.js",
          component_format: "esm-mount",
        },
      ],
    },

    // Closed-set env contract (DATABASE_URL + DATABASE_SCHEMA only) is
    // enforced by assertDbEnv() inside createMicroservice — envSchema has
    // no keys left to declare.
    envSchema: {},

    initDal,
    dalClose: async () => { await getDal().close(); },
    dbBanner: () => pgServerBanner(getDal(), process.env.DATABASE_URL!),

    // Step 2.5 — own-schema migrations BEFORE ConfigLoader/registration.
    // Engine reads mode from job.config_entries (key db_migration.mode).
    // Mode lives in job.config_entries (key db_migration.mode) — never env.
    // Trust: dev-signed manifests are accepted only outside production.
    dbPatches: {
      engine: dalMigrations,
      // standards-exempt: getPool — dbPatches migration engine needs the raw pool (sanctioned seam)
      pool: () => getDal().getPool(),
      schema: () => assertDbEnv().schemas[0],
      patchesDir: join(process.cwd(), "db-meta", "patches"),
      entityRegistry: [...ENTITY_REGISTRY],
      allowedTrust:
        process.env.NODE_ENV === "production" ? ["release"] : ["dev", "release"],
    },

    configRepositoryAdapter: () => new ConfigRepositoryAdapter(),
    authConfigPort: (configLoader) => new JobAuthConfigPort(configLoader),
    healthCheckPort: () => new HealthCheckAdapter(getDal()),

    routeHandler: composeRouteHandlers(jobEntityRouteHandler, jobActionsRouteHandler, moduleAssetsRouteHandler),

    onReady: async () => {
      // JOBS stream — scheduler storage. Wildcards kept NARROW on purpose:
      // `jobs.ctl.*` request subjects must NOT be captured by the stream
      // or the PubAck impersonates the correlation reply.
      await NatsClient.ensureStream(JOBS_STREAM, [
        "jobs.schedule.>",
        "jobs.due.>",
        "jobs.result.>",
        "jobs.cancel.>",
        "jobs.ctl.rules.changed",
      ], { allowMsgSchedules: true, syncSubjects: true });

      await registerScheduleRoutes();
      await startRunRecorder();
      await startRulesEngine();
    },
  });
}

main().catch((err) => {
  logger.error("fatal", { tags: ["job"], error: err });
  process.exit(1);
});
