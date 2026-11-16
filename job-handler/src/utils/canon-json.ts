import { extJsonStringify } from "@primebrick/sdk";

/**
 * Canonical JSON serialization (sorted object keys, recursive) — the
 * jsonb fields (`payload_map`, `filter`) compare structurally, so a
 * re-ordered body carrying the SAME value is never misread as a
 * mutation. Shared by the frozen-set wire rule and the system-trigger
 * reconcile's delta detection.
 */
export function canonJson(v: unknown): string {
  if (v === null || v === undefined || typeof v !== "object") return extJsonStringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(canonJson).join(",")}]`;
  return `{${Object.keys(v as Record<string, unknown>)
    .sort()
    .map((k) => `${extJsonStringify(k)}:${canonJson((v as Record<string, unknown>)[k])}`)
    .join(",")}}`;
}
