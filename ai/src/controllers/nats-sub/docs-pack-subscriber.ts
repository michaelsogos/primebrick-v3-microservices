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
  DOCS_PACK_CAPABILITY,
  SERVICE_SUBJECTS,
  type ServiceRegisterPayload,
  type ServiceUnregisterPayload,
} from "@primebrick/sdk";
import { pullAndIngest } from "../../services/docs-pack-reindex.js";
import { deleteRepoDocs } from "../../services/docs-kb-repository.js";

/** service code → KB repo key, so unregister deletes the right corpus. */
const repoByService = new Map<string, string>();

export async function startDocsPackSubscriber(beBaseUrl: string): Promise<void> {
  await subscribeShielded<ServiceRegisterPayload>(SERVICE_SUBJECTS.REGISTER, async (p) => {
    if (!p.capabilities?.includes(DOCS_PACK_CAPABILITY)) return;
    void pullAndIngest(p.base_url, p.code, "register").then((r) => {
      if (r.repo) repoByService.set(p.code, r.repo);
    }); // fire-and-forget: never block lifecycle
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
    void pullAndIngest(beBaseUrl, "backend", "gateway_online");
  });
  void pullAndIngest(beBaseUrl, "backend", "startup");

  logger.info("Subscribed to service lifecycle events for documentation packs", { tags: ["docs-pack"] });
}
