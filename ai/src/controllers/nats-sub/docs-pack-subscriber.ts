/**
 * Docs-pack lifecycle subscriber — pulls a service's documentation pack
 * when it registers with the `docs_pack` capability, ingests it into the
 * KB under the pack's repo key, and drops that repo's docs on unregister.
 *
 * Fire-and-forget by design: ingestion is idempotent (content-hash diff),
 * failures are logged and never block registration. Re-registration is
 * self-healing — the AI re-pulls the pack on every service.register.
 */

import {
  logger,
  subscribeShielded,
  fetchDocsPack,
  DOCS_PACK_CAPABILITY,
  SERVICE_SUBJECTS,
  type ServiceRegisterPayload,
  type ServiceUnregisterPayload,
} from "@primebrick/sdk";
import { ingestDocsPack } from "../../services/docs-pack-ingest.js";
import { deleteRepoDocs } from "../../services/docs-kb-repository.js";

/** service code → KB repo key, so unregister deletes the right corpus. */
const repoByService = new Map<string, string>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Retry-bounded pack pull. The gateway_online → pull race loses when the
 * BE rotates the client-shield secret at boot: the pull fires before
 * `secret.rotated` reaches this service → 401 → without a retry the pack
 * (and its KB corpus) would stay stale until the next lifecycle event.
 */
async function pullAndIngest(baseUrl: string, serviceCode: string): Promise<void> {
  const MAX_ATTEMPTS = 6;
  for (let attempt = 1; ; attempt++) {
    try {
      const payload = await fetchDocsPack(baseUrl);
      repoByService.set(serviceCode, payload.manifest.repo);
      const stats = await ingestDocsPack(payload);
      logger.info(
        `Ingested the documentation pack of service ${serviceCode} — ${stats.chunks_embedded} chunks embedded, ${stats.chunks_skipped} unchanged, ${stats.chunks_deleted} removed (${stats.docs_loaded} docs, repo "${payload.manifest.repo}")`,
        { tags: ["docs-pack"] },
      );
      return;
    } catch (err) {
      if (attempt >= MAX_ATTEMPTS) {
        logger.error(
          `Failed to pull or ingest the documentation pack of service ${serviceCode} at ${baseUrl} after ${MAX_ATTEMPTS} attempts`,
          { tags: ["docs-pack"], error: err instanceof Error ? err.message : err },
        );
        return;
      }
      logger.warn(
        `docs-pack pull of ${serviceCode} failed (attempt ${attempt}/${MAX_ATTEMPTS}) — retrying in ${attempt * 5}s`,
        { tags: ["docs-pack"], error: err instanceof Error ? err.message : err },
      );
      await sleep(attempt * 5000);
    }
  }
}

export async function startDocsPackSubscriber(beBaseUrl: string): Promise<void> {
  await subscribeShielded<ServiceRegisterPayload>(SERVICE_SUBJECTS.REGISTER, async (p) => {
    if (!p.capabilities?.includes(DOCS_PACK_CAPABILITY)) return;
    void pullAndIngest(p.base_url, p.code); // fire-and-forget: never block lifecycle
  });

  await subscribeShielded<ServiceUnregisterPayload>(SERVICE_SUBJECTS.UNREGISTER, async (p) => {
    const repo = repoByService.get(p.code) ?? p.code;
    const deleted = await deleteRepoDocs(repo);
    repoByService.delete(p.code);
    if (deleted > 0) {
      logger.info(`Service ${p.code} unregistered — removed ${deleted} knowledge-base chunks of repo "${repo}"`, { tags: ["docs-pack"] });
    }
  });

  // The BE never publishes service.register (it IS the registry) — its
  // pack is pulled at startup and re-pulled on every gateway_online
  // broadcast (BE restart → self-healing re-ingest, hashes make it cheap).
  await subscribeShielded(SERVICE_SUBJECTS.GATEWAY_ONLINE, async () => {
    void pullAndIngest(beBaseUrl, "backend");
  });
  void pullAndIngest(beBaseUrl, "backend");

  logger.info("Subscribed to service lifecycle events for documentation packs", { tags: ["docs-pack"] });
}
