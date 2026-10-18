/**
 * Dev-mode docs-pack reindex — re-pulls every live service's docs pack
 * (BE + all registered docs_pack services) and re-ingests incrementally,
 * WITHOUT restarting anything. The production path stays service
 * restart → register → automatic pull; this is the debugging shortcut
 * for the cases where docs/code changed under a running service
 * (edited manual MDX, regenerated generated/, fresh git pull).
 *
 *   bun scripts/reindex-packs.ts [--repo <name>]
 *
 * Same wire path as the lifecycle pull: internalFetch → Client Shield
 * identity + rotating secret header, hydrated from Redis so the stamped
 * secret matches the BE's current slot.
 */
import "dotenv/config";
import { createClient } from "redis";
import {
  configureInternalClient,
  setClientShieldSecretSlot,
  CLIENT_SHIELD_KEY_HEADER,
  CLIENT_SHIELD_SECRET_REF,
  type ClientShieldSecretSlot,
} from "@primebrick/sdk";
import { field, Filter, Project } from "@primebrick/dal-pg";
import { initDal, getDal } from "../src/db/dal.js";
import { reindexDocsPacks } from "../src/services/docs-pack-reindex.js";
import { ConfigEntryEntity } from "../src/domain/entities/config_entry_entity.js";
// redis_url lives in public.config_entries — BE-owned schema. The ai registry
// deliberately has no public-schema entity (sovereignty), so this dev script
// reads it with a raw pg client instead of an entity.
import { Client as PgClient } from "pg";

const repo = process.argv.includes("--repo")
  ? process.argv[process.argv.indexOf("--repo") + 1]
  : undefined;

initDal();
await getDal();

// aiConfig() needs the running-service ConfigLoader — the script reads the
// same ai.config_entries rows via the DAL instead.
const valueProjection = [Project.field(field(ConfigEntryEntity, "value"))];
const cfg = async (key: string): Promise<string | null> =>
  (
    await getDal().find<ConfigEntryEntity, { value: string | null }>(ConfigEntryEntity, valueProjection, {
      filters: [Filter.fieldValue(field(ConfigEntryEntity, "key"), "=", key)],
    })
  )?.value ?? null;

const shieldKey = await cfg("service_client_shield_key");
const beBaseUrl = await cfg("be_base_url");
configureInternalClient(() => ({
  // Same identity the running AI service presents — the client registry
  // pairs ua_prefix `primebrick-ai/0.6.0` with this service's shield key.
  "User-Agent": "primebrick-ai/0.6.0 (docs:reindex)",
  ...(shieldKey ? { [CLIENT_SHIELD_KEY_HEADER]: shieldKey } : {}),
}));

// Hydrate the rotating-secret slot exactly like SecretProvider does:
// Redis primebrick:secrets:global:service_client_shield_secret.
let redisUrl: string | null = null;
{
  const pg = new PgClient({ connectionString: process.env.DATABASE_URL });
  try {
    await pg.connect();
    const r = await pg.query<{ value: string }>(
      "SELECT value FROM public.config_entries WHERE key = 'redis_url' AND deleted_at IS NULL",
    );
    redisUrl = r.rows[0]?.value ?? null;
  } finally {
    await pg.end().catch(() => {});
  }
}
if (redisUrl) {
  const redis = createClient({ url: redisUrl });
  try {
    await redis.connect();
    const h = await redis.hGetAll(`primebrick:secrets:${CLIENT_SHIELD_SECRET_REF.scope}:${CLIENT_SHIELD_SECRET_REF.name}`);
    if (h.current) {
      const slot: ClientShieldSecretSlot = {
        current: h.current,
        previous: h.previous || null,
        rotated_at: Number(h.rotated_at) || 0,
      };
      setClientShieldSecretSlot(slot);
      console.log(`client-shield secret hydrated from Redis (rotated_at=${new Date(slot.rotated_at).toISOString()})`);
    } else {
      console.warn("no rotating secret found in Redis — pulls will rely on any static fallback");
    }
  } finally {
    await redis.quit().catch(() => {});
  }
} else {
  console.warn("redis_url not configured — pulls will rely on any static fallback");
}

const results = await reindexDocsPacks({ repo, trigger: "dev_script", beBaseUrl: beBaseUrl ?? undefined });
for (const r of results) {
  if (!r.ok) {
    console.error(`✗ ${r.service}: ${r.error}`);
    continue;
  }
  const s = r.stats!;
  console.log(
    `✓ ${r.service} (repo "${r.repo}"): ${s.docs_loaded} docs, ${s.chunks_created} created, ` +
      `${s.chunks_embedded} embedded, ${s.chunks_skipped} skipped, ${s.chunks_deleted} deleted ` +
      `(total_in_db=${s.total_in_db}, ${s.duration_ms}ms)`,
  );
}
if (results.every((r) => !r.ok)) process.exit(1);
