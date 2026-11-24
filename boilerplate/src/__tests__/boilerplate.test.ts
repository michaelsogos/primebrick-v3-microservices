/**
 * Boilerplate self-check — proves the template's own wiring is real:
 * the route surface resolves, the DomainService constructs (I/O-free
 * ctor — getDal resolves lazily at first use), and the entity registry
 * carries both entities the db-meta patches create.
 *
 * No DB/NATS needed: these tests exercise construction-time contracts
 * only — the same guarantee `pnpm build` gives, plus spec shape.
 */
import { describe, it, expect } from "vitest";
import { TestItemsService } from "../modules/test/test-items.service.js";
import { ConfigEntriesService } from "../modules/config-entries/config-entries.service.js";
import { testItemMeta } from "../modules/test/test-item.meta.js";
import { ENTITY_REGISTRY } from "../domain/entities/registry.js";
import { testActionRoutes } from "../controllers/http/test-actions-route.js";

// `makeServiceRoutes` pulls builtin entity decls whose construction
// requires the module's owned schema — in prod it comes from .env
// (DATABASE_SCHEMA=boilerplate); vitest does not load .env, so mirror it
// here and import the route surface lazily below.
process.env.DATABASE_SCHEMA ??= "boilerplate";

describe("boilerplate wiring", () => {
  it("entity registry carries config_entry + test_item", () => {
    const names = ENTITY_REGISTRY.map((e) => e.name);
    expect(names).toContain("ConfigEntryEntity");
    expect(names).toContain("TestItemEntity");
  });

  it("DomainService ctors are I/O-free (lazy dal)", () => {
    expect(() => new TestItemsService()).not.toThrow();
    expect(() => new ConfigEntriesService()).not.toThrow();
  });

  it("test_item meta targets the entity and its namespace", () => {
    expect(testItemMeta.entity).toBe("test_item");
    expect(testItemMeta.entities_ns).toBe("boilerplate");
    expect(testItemMeta.uid).toBe("uuid");
    const keys = testItemMeta.columns.map((c) => c.key);
    // Declared columns lead; audit/soft-delete columns are auto-derived
    // by withColumnConstraints (uuid, created_*/updated_*, deleted_*).
    expect(keys.slice(0, 3)).toEqual(["name", "note", "enabled"]);
    expect(keys).toContain("version");
  });

  it("route handler carries a built OpenAPI spec (one declaration)", async () => {
    const { boilerplateRouteHandler } = await import("../service-routes.js");
    const spec = boilerplateRouteHandler.spec as {
      paths?: Record<string, unknown>;
      openapi?: string;
    };
    expect(spec.openapi).toBeDefined();
    const paths = Object.keys(spec.paths ?? {});
    expect(paths.some((p) => p.includes("/entities/test_item"))).toBe(true);
    expect(paths).toContain("/api/v1/actions/test-ping");
    expect(paths).toContain("/api/v1/actions/test-echo");
  });

  it("test action routes require user auth (none public)", () => {
    for (const r of testActionRoutes) {
      expect(r.auth ?? "user").toBe("user");
      expect(r.permissions?.length).toBeGreaterThan(0);
    }
  });
});
