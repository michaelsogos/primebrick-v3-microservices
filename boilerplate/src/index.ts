import "dotenv/config";
import "reflect-metadata";
import { join } from "node:path";
import {
  createMicroservice,
  logger,
  pgServerBanner,
  assertDbEnv,
  CachingApiKeyPort,
  NatsApiKeyPort,
  getSdkCachePort,
} from "@primebrick/sdk";
import * as dalMigrations from "@primebrick/dal-pg";
import { initDal, getDal } from "./db/dal.js";
import { ENTITY_REGISTRY } from "./domain/entities/registry.js";
import {
  ConfigRepositoryAdapter,
  HealthCheckAdapter,
  BoilerplateAuthConfigPort,
} from "./adapters/index.js";
import { boilerplateRouteHandler } from "./service-routes.js";
import { BOILERPLATE_EVENTS } from "./events-declaration.js";

async function main(): Promise<void> {
  // ══════════════ BOILERPLATE GUARD — DELETE TO ACTIVATE ══════════════
  // This folder is a CLONE SOURCE, not a runnable service: booting it
  // would register a phantom "boilerplate" module (schema, routes,
  // registry entry) into the live platform. After copying the folder,
  // rename <boilerplate> everywhere (package.json name, serviceName +
  // displayName, DATABASE_SCHEMA, schema tokens in entities/patches,
  // ports, i18n_namespaces, seed values) and DELETE this block — the
  // service then boots for real with zero further code, serving
  // /api/v1/entities/test_item + /api/v1/actions/test-* + config_entry.
  //
  // `--emit-docs` passes through on purpose: emitting the OpenAPI/docs
  // surface is side-effect free and keeps `pnpm test`/`docs:check` able
  // to prove the template's own routes compile and serve for real.
  if (!process.argv.includes("--emit-docs")) {
    logger.error(
      "This is the boilerplate microservice — it must not run as-is. " +
      "Clone the folder, rename <boilerplate> everywhere, then delete the " +
      "guard block at the top of main() in src/index.ts.",
      { tags: ["boilerplate"] },
    );
    process.exit(1);
  }
  // ════════════════ END BOILERPLATE GUARD ════════════════

  await createMicroservice({
    serviceName: "boilerplate",
    serviceDisplayName: "Boilerplate Service",
    serviceDescription:
      "Clone-source template for new microservices — rename <boilerplate> with your service code",
    icon: "package",
    iconType: "icon",

    // Root level — system module: route prefix /system/boilerplate.
    partOf: "system",

    // Emitted-event vocabulary (empty on the template) — declare your
    // subjects in events-declaration.ts.
    events: BOILERPLATE_EVENTS,

    // Closed-set env contract (DATABASE_URL + DATABASE_SCHEMA only) is
    // enforced by assertDbEnv() inside createMicroservice — envSchema has
    // no keys left to declare.
    envSchema: {},

    initDal,
    dalClose: async () => { await getDal().close(); },
    dbBanner: () => pgServerBanner(getDal(), process.env.DATABASE_URL!),

    // Step 2.5 — own-schema migrations BEFORE ConfigLoader/registration.
    // Mode lives in boilerplate.config_entries (key db_migration.mode).
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

    // Shared system job — the SDK mounts `boilerplate.partition_maintenance`
    // and materializes its trigger only when the registry carries a
    // maintained surface (@Partition / @AuditTrail / @Retention).
    partitionMaintenance: dalMigrations.makePartitionMaintenanceJob(ENTITY_REGISTRY),
    sequenceRevive: dalMigrations.makeSequenceReviveJob(),

    configRepositoryAdapter: () => new ConfigRepositoryAdapter(),
    authConfigPort: (configLoader) => new BoilerplateAuthConfigPort(configLoader),
    apiKeyPort: () =>
      new CachingApiKeyPort(new NatsApiKeyPort(3000), () => getSdkCachePort()),
    healthCheckPort: () => new HealthCheckAdapter(getDal()),

    routeHandler: boilerplateRouteHandler,
    endpoints: {},

    onReady: async () => {
      // Wire NATS subscribers (controllers/nats-sub/), config holders and
      // cron jobs here — see emailsender/job-handler for the patterns.
    },
  });
}

main().catch((err) => {
  logger.error("fatal", { tags: ["boilerplate"], error: err });
  process.exit(1);
});
