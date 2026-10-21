import { describe, expect, it } from "vitest";
import { join, resolve, sep } from "node:path";
import {
  moduleAssetCacheControl,
  moduleAssetContentType,
  resolveModuleAssetPath,
} from "../module-assets-route.js";

const ASSETS_ROOT = resolve(process.cwd(), "fe", "dist");

describe("resolveModuleAssetPath", () => {
  it("resolves a plain asset name inside the root", () => {
    expect(resolveModuleAssetPath("jobs-page.js")).toBe(join(ASSETS_ROOT, "jobs-page.js"));
  });

  it("resolves nested paths", () => {
    expect(resolveModuleAssetPath("chunks/foo-abc12345.js")).toBe(
      join(ASSETS_ROOT, "chunks", "foo-abc12345.js"),
    );
  });

  it("rejects path traversal", () => {
    expect(resolveModuleAssetPath("../secrets.txt")).toBeNull();
    expect(resolveModuleAssetPath("..\\secrets.txt")).toBeNull();
    expect(resolveModuleAssetPath("sub/../../escape.js")).toBeNull();
  });

  it("keeps percent-encoded input inside the root (stat→404 catches it)", () => {
    // URL paths arrive percent-encoded — normalize() does not decode, so
    // `%2e%2e/…` never becomes `..` and resolves harmlessly under the root.
    const resolved = resolveModuleAssetPath("%2e%2e/escape.js");
    if (resolved !== null) {
      expect(resolved.startsWith(ASSETS_ROOT + sep)).toBe(true);
    }
  });

  it("rejects empty/dot paths", () => {
    expect(resolveModuleAssetPath("")).toBeNull();
    expect(resolveModuleAssetPath(".")).toBeNull();
  });
});

describe("moduleAssetContentType", () => {
  it("maps known extensions", () => {
    expect(moduleAssetContentType(join(ASSETS_ROOT, "a.js"))).toContain("text/javascript");
    expect(moduleAssetContentType(join(ASSETS_ROOT, "a.css"))).toContain("text/css");
    expect(moduleAssetContentType(join(ASSETS_ROOT, "a.svg"))).toBe("image/svg+xml");
    expect(moduleAssetContentType(join(ASSETS_ROOT, "a.woff2"))).toBe("font/woff2");
  });

  it("falls back to octet-stream for unknown extensions", () => {
    expect(moduleAssetContentType(join(ASSETS_ROOT, "a.bin"))).toBe("application/octet-stream");
  });
});

describe("moduleAssetCacheControl", () => {
  it("immutable for vite content-hashed names", () => {
    expect(moduleAssetCacheControl("chunk-Ab3d9Kx2.js")).toContain("immutable");
  });

  it("no-cache for predictable entry names", () => {
    expect(moduleAssetCacheControl("jobs-page.js")).toBe("no-cache");
    expect(moduleAssetCacheControl("jobs-page.css")).toBe("no-cache");
  });
});
