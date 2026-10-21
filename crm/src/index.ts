/**
 * primebrick-crm — CRM playground/case-study module.
 *
 * This service is a PLAYGROUND for the module-ownership architecture, NOT a
 * business or product module: it exists to prove that a module can own its
 * navigation, route prefixes and translations via service registration —
 * and it will eventually be split out into a standalone product.
 *
 * What it does today: declares the crm module (nav + route census) so the
 * module switcher and route ownership resolve `/crm/customers` and
 * `/crm/pipeline` to `crm` instead of being borrowed from another module's static
 * registry. The customer entity pages themselves stay BE-served for now
 * (route decls reference entity `customer` rendered by the FE pipeline);
 * entity API ownership migrates to this service in a later phase.
 *
 * Run from a terminal: `pnpm dev` inside primebrick-us-v3/crm.
 */
import "dotenv/config";
import "reflect-metadata";
import { join } from "node:path";
import {
  createMicroservice,
  logger,
  pgServerBanner,
} from "@primebrick/sdk";
import * as dalMigrations from "@primebrick/dal-pg";
import { initDal, getDal } from "./db/dal.js";
import { ENTITY_REGISTRY } from "./domain/entities/registry.js";
import { ConfigRepositoryAdapter } from "./adapters/config-repository-adapter.js";
import { HealthCheckAdapter } from "./adapters/health-check-adapter.js";
import { CrmAuthConfigPort } from "./adapters/auth-ports-adapter.js";
import { assertDbEnv } from "@primebrick/sdk";
import { CRM_NAV } from "./nav-declaration.js";

async function main(): Promise<void> {
  await createMicroservice({
    serviceName: "crm",
    serviceDisplayName: "CRM",
    serviceDescription:
      "CRM playground — module-ownership case study: nav, route census and translations declared via service registration.",
    icon: "users",
    iconType: "icon",

    // Root level — the CRM module IS its own root level: its FE route
    // prefix is `/{part_of}/{code}` = /crm (validated at registration).
    partOf: "crm",

    // Module display-name key — resolved against this service's own
    // `crm.translations` namespace by every UI surface (launcher,
    // breadcrumbs, module menus); fallback: raw registry `name`.
    labelKey: "crm.module.name",

    // Module self-declaration — persisted in service_registry.endpoints.nav.
    // The crm module OWNS /crm plus an EXTRA root membership under
    // `system`: the pipeline page lives at /system/crm/pipeline — a crm
    // page inside the System app ("a foot in two shoes"). The code stays
    // the URL's second segment in every prefix, so longest-prefix
    // ownership keeps resolving module=breadcrumb.
    nav: CRM_NAV,

    // Closed-set env contract (DATABASE_URL + DATABASE_SCHEMA only) is
    // enforced by assertDbEnv() inside createMicroservice — envSchema has
    // no keys left to declare.
    envSchema: {},

    initDal,
    dalClose: async () => { await getDal().close(); },
    dbBanner: () => pgServerBanner(getDal(), process.env.DATABASE_URL!),

    // Own-schema migrations BEFORE ConfigLoader/registration.
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
    authConfigPort: (configLoader) => new CrmAuthConfigPort(configLoader),
    healthCheckPort: () => new HealthCheckAdapter(getDal()),

    // No custom routes, no NATS streams — the playground only serves
    // /health plus the built-in microservice surface. Its real job is
    // declaring the module at registration time.
  });
}

main().catch((err) => {
  logger.error("fatal", { tags: ["crm"], error: err });
  process.exit(1);
});
