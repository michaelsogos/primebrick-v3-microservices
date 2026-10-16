/**
 * Rate limiter for the AI chat endpoint.
 *
 * Uses a token bucket algorithm per-user (identified by x-user-id header).
 * - If the shared redis_url (from BE global config) is set, uses Redis for
 *   distributed rate limiting.
 * - Otherwise falls back to in-memory rate limiting (single instance).
 *
 * Config (ai.config_entries — env-policy: no env vars besides DATABASE_URL):
 * - rate_limit_capacity: max tokens in the bucket (default: 10)
 * - rate_limit_refill_rate: tokens refilled per second (default: 1)
 * - rate_limit_token_cost: tokens consumed per chat request (default: 1)
 */

import { logger, getSharedConfig } from "@primebrick/sdk";
import { aiConfig } from "../config/ai-config.js";

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const inMemoryBuckets = new Map<string, Bucket>();
let redisClient: { incr: (key: string) => Promise<number>; expire: (key: string, seconds: number) => Promise<void> } | null = null;
let redisInitPromise: Promise<void> | null = null;

const CAPACITY = () => parseInt(aiConfig("rate_limit_capacity") ?? "10", 10);
const REFILL_RATE = () => parseFloat(aiConfig("rate_limit_refill_rate") ?? "1");
const TOKEN_COST = () => parseInt(aiConfig("rate_limit_token_cost") ?? "1", 10);

/**
 * Initialize Redis client if the BE shared config carries redis_url.
 * Lazy init — only called on first rate limit check.
 */
async function initRedis(): Promise<void> {
  if (redisInitPromise) return redisInitPromise;
  redisInitPromise = (async () => {
    const redisUrl = getSharedConfig().redis_url;
    if (!redisUrl) return;

    try {
      // Dynamic import to avoid hard dependency on ioredis.
      // ioredis is an optional peer dependency — only needed if REDIS_URL is set.
      // Using a string variable to prevent bundlers from trying to resolve it at build time.
      const moduleName = "ioredis";
      const mod = await import(/* @vite-ignore */ moduleName);
      const IORedis = mod.default;
      const client = new IORedis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
      await client.connect();
      redisClient = {
        incr: (key: string) => client.incr(key),
        expire: (key: string, seconds: number) => client.expire(key, seconds),
      };
      logger.info("Redis connected for distributed rate limiting", { tags: ["rate-limiter"] });
    } catch (e) {
      logger.warn("Redis init failed, falling back to in-memory", { tags: ["rate-limiter"], error: e instanceof Error ? e.message : e });
    }
  })();
  return redisInitPromise;
}

/**
 * Check if a user is allowed to make a request.
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }.
 */
export async function checkRateLimit(userUuid: string): Promise<{
  allowed: boolean;
  retryAfter?: number;
}> {
  await initRedis();

  if (redisClient) {
    return checkRedisRateLimit(userUuid);
  }
  return checkInMemoryRateLimit(userUuid);
}

/**
 * Redis-based rate limit using a sliding window counter.
 * Key: ai:rate:{userUuid} — incremented per request, expired after the window.
 */
async function checkRedisRateLimit(userUuid: string): Promise<{
  allowed: boolean;
  retryAfter?: number;
}> {
  const key = `ai:rate:${userUuid}`;
  const windowSeconds = Math.ceil(CAPACITY() / REFILL_RATE());

  const count = await redisClient!.incr(key);
  if (count === 1) {
    await redisClient!.expire(key, windowSeconds);
  }

  if (count > CAPACITY()) {
    return { allowed: false, retryAfter: windowSeconds };
  }
  return { allowed: true };
}

/**
 * In-memory token bucket rate limit (for single-instance deployments).
 */
function checkInMemoryRateLimit(userUuid: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  let bucket = inMemoryBuckets.get(userUuid);

  if (!bucket) {
    bucket = { tokens: CAPACITY(), lastRefill: now };
    inMemoryBuckets.set(userUuid, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsedSeconds = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(CAPACITY(), bucket.tokens + elapsedSeconds * REFILL_RATE());
  bucket.lastRefill = now;

  if (bucket.tokens >= TOKEN_COST()) {
    bucket.tokens -= TOKEN_COST();
    return { allowed: true };
  }

  const tokensNeeded = TOKEN_COST() - bucket.tokens;
  const retryAfter = Math.ceil(tokensNeeded / REFILL_RATE());
  return { allowed: false, retryAfter };
}