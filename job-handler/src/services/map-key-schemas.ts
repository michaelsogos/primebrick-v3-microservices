/**
 * map-key-schemas — resolve `x_map_keys` declarations for the write-time
 * payload-map gate.
 *
 * The FE editor resolves a field's `x_map_keys {from, prop}` row lazily —
 * e.g. `variables` declared by the `email_template` row the user picked in
 * `templateCode`. The wire gate must prove the same thing or the save can
 * differ: a required nested variable the editor blocked on would sail
 * through the API unvalidated.
 *
 * Resolution mirrors the form, through the governed surfaces only:
 *   `x_options.api_url` (declared on the `from` prop) names the catalog
 *   endpoint — `/svc/<code>/<path>`. US-side the same route is reached on
 *   the service's own `base_url` (resolved via `service.registry.get`,
 *   the sanctioned registry surface) through `internalFetch` — the only
 *   legal US→US HTTP client. The owner's public entity API is the same
 *   one the FE calls; no cross-schema reads.
 *
 * Every resolution failure fails OPEN — the prop is skipped and the base
 * map check stands. A `from` entry that is `path`/`meta`-bound (runtime
 * value) or a catalog row nobody serves can't be proven at write time;
 * rejecting would be guesswork. The layer tightens only what is provable.
 */

import {
  callNats,
  internalFetch,
  logger,
  parseMapKeysDeclaration,
  PAYLOAD_X_MAP_KEYS,
  PAYLOAD_X_OPTIONS,
  type MapKeyDecl,
  type PayloadMapKeysHint,
  type PayloadOptionsSource,
} from "@primebrick/sdk";

/** `service.registry.get {code}` → the service's HTTP `base_url` (the same
 *  row the `/svc` proxy targets). Cached per code — registration churn is
 *  rare and a stale URL fails soft on the next write. */
const baseUrlCache = new Map<string, Promise<string | undefined>>();

async function serviceBaseUrl(code: string): Promise<string | undefined> {
  let p = baseUrlCache.get(code);
  if (!p) {
    p = callNats<{ base_url?: string } | null>("service.registry.get", { code }, { timeoutMs: 3000 })
      .then((row) => (typeof row?.base_url === "string" ? row.base_url : undefined))
      .catch(() => undefined);
    baseUrlCache.set(code, p);
  }
  return p;
}

/** Parse `/svc/<code>/<path>` — the proxy shape `x_options.api_url`
 *  declares. Anything else is not a governed service route → skip. */
function svcPath(api_url: string): { code: string; path: string } | undefined {
  const m = /^\/svc\/([a-z0-9-]+)(\/.*)$/.exec(api_url);
  return m ? { code: m[1]!, path: m[2]! } : undefined;
}

/**
 * Resolved key schemas for `payloadMapConformance`'s `mapKeySchemas`
 * param — `{field: {key: schema}}`. For every callable prop carrying
 * `x_map_keys`: the map's `from` entry must be a const string (the same
 * resolution rule the editor applies — only a fixed pick has provable
 * declared keys), `x_options.api_url` on the `from` prop names the
 * catalog endpoint, and the selected row's `hint.prop` column carries
 * the declared key set.
 */
export async function resolveMapKeySchemas(
  callableSchema: Record<string, unknown>,
  map: Record<string, unknown>,
): Promise<Record<string, Record<string, MapKeyDecl>> | undefined> {
  const props = (callableSchema["properties"] ?? {}) as Record<string, Record<string, unknown>>;
  const out: Record<string, Record<string, MapKeyDecl>> = {};
  for (const [field, prop] of Object.entries(props)) {
    const hint = prop[PAYLOAD_X_MAP_KEYS] as PayloadMapKeysHint | undefined;
    if (!hint?.from || !hint.prop) continue;
    const fromEntry = map[hint.from] as { kind?: string; value?: unknown } | undefined;
    if (fromEntry?.kind !== "const" || typeof fromEntry.value !== "string" || !fromEntry.value) continue;
    const src = props[hint.from]?.[PAYLOAD_X_OPTIONS] as PayloadOptionsSource | undefined;
    const parsed = src?.api_url ? svcPath(src.api_url) : undefined;
    if (!parsed) continue;
    try {
      const base = await serviceBaseUrl(parsed.code);
      if (!base) continue;
      const res = await internalFetch(`${base}${parsed.path}`, { method: src?.api_verb ?? "GET" });
      if (!res.ok) continue;
      const data = (await res.json()) as { rows?: Record<string, unknown>[] };
      const row = (data.rows ?? []).find((r) => r[src?.value_field ?? ""] === fromEntry.value);
      if (!row) continue;
      const decls = parseMapKeysDeclaration(row[hint.prop]);
      if (Object.keys(decls).length > 0) out[field] = decls;
    } catch (err) {
      logger.warn(`map-key-schemas: "${field}" resolution failed (${String(err)})`, { tags: ["jobs"] });
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
