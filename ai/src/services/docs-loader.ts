/**
 * Documentation loader — reads MDX files and OpenAPI specs from the filesystem.
 *
 * The docs path is configured via the DOCS_PATH env var (or defaults to
 * the primebrick-v3-docs repo's pages/ directory). The loader supports two
 * source types:
 *
 * 1. MDX files: read from DOCS_PATH / repo / guide / (recursive .mdx)
 * 2. OpenAPI specs: read from OPENAPI_PATH / .json (chunked per endpoint)
 *
 * Each loaded doc is tagged with metadata: source, repo, path, title, content_type.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { parseMdxFrontmatter } from "./chunking.js";

export interface LoadedDoc {
  repo: string;
  path: string;
  title: string;
  content: string;
  metadata: {
    source: "mdx" | "openapi";
    repo: string;
    path: string;
    title: string;
    content_type: "tutorial" | "reference" | "conceptual" | "api";
    heading_path?: string;
    entity?: string;
    endpoint?: string;
  };
}

/**
 * Load all MDX docs from the docs path.
 *
 * Expected structure: DOCS_PATH / repo / guide / (recursive .mdx files)
 * Repos: backend, frontend, dal, sdk, microservices, getting-started, api
 */
export function loadMdxDocs(docsPath: string): LoadedDoc[] {
  const docs: LoadedDoc[] = [];
  const repos = listDirs(docsPath);

  for (const repo of repos) {
    const repoGuidePath = join(docsPath, repo, "guide");
    if (!exists(repoGuidePath)) continue;

    const mdxFiles = listFilesRecursive(repoGuidePath, ".mdx");
    for (const filePath of mdxFiles) {
      try {
        const raw = readFileSync(filePath, "utf-8");
        const { frontmatter, body } = parseMdxFrontmatter(raw);
        const relPath = relative(docsPath, filePath).replace(/\\/g, "/");
        const title = frontmatter.title || relPath;

        docs.push({
          repo,
          path: relPath,
          title,
          content: body,
          metadata: {
            source: "mdx",
            repo,
            path: relPath,
            title,
            content_type: detectContentType(relPath, frontmatter),
          },
        });
      } catch (err) {
        console.warn(`Failed to load MDX ${filePath}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  return docs;
}

/**
 * Load OpenAPI specs and chunk them per endpoint.
 *
 * Each endpoint becomes a separate doc with metadata.endpoint = "METHOD /path".
 */
export function loadOpenApiSpecs(openApiPath: string): LoadedDoc[] {
  const docs: LoadedDoc[] = [];
  if (!exists(openApiPath)) return docs;

  const jsonFiles = listFiles(openApiPath, ".json");
  for (const filePath of jsonFiles) {
    try {
      const raw = readFileSync(filePath, "utf-8");
      const spec = JSON.parse(raw) as {
        openapi?: string;
        info?: { title?: string };
        paths?: Record<string, Record<string, unknown>>;
      };
      const fileName = relative(openApiPath, filePath).replace(/\\/g, "/");
      const specName = fileName.replace(/\.json$/, "");
      const specTitle = spec.info?.title || specName;

      if (!spec.paths) continue;

      for (const [pathStr, methods] of Object.entries(spec.paths)) {
        for (const [method, operation] of Object.entries(methods)) {
          const op = operation as { summary?: string; description?: string; operationId?: string };
          const endpoint = `${method.toUpperCase()} ${pathStr}`;
          const content = formatOpenApiEndpoint(specTitle, method.toUpperCase(), pathStr, op);

          docs.push({
            repo: "api",
            path: `${specName}#${endpoint}`,
            title: op.summary || endpoint,
            content,
            metadata: {
              source: "openapi",
              repo: "api",
              path: `${specName}#${endpoint}`,
              title: op.summary || endpoint,
              content_type: "api",
              endpoint,
            },
          });
        }
      }
    } catch (err) {
      console.warn(`Failed to load OpenAPI ${filePath}:`, err instanceof Error ? err.message : err);
    }
  }

  return docs;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatOpenApiEndpoint(
  specTitle: string,
  method: string,
  path: string,
  op: { summary?: string; description?: string; operationId?: string },
): string {
  const lines: string[] = [];
  lines.push(`# ${specTitle} — ${method} ${path}`);
  if (op.summary) lines.push(`\n**Summary:** ${op.summary}`);
  if (op.description) lines.push(`\n${op.description}`);
  if (op.operationId) lines.push(`\n**Operation ID:** ${op.operationId}`);
  return lines.join("\n");
}

function detectContentType(
  path: string,
  frontmatter: Record<string, string>,
): "tutorial" | "reference" | "conceptual" | "api" {
  if (frontmatter.source === "api" || path.includes("/api/")) return "api";
  if (path.includes("reference") || path.includes("filter-") || path.includes("entity-field")) return "reference";
  if (path.includes("getting-started") || path.includes("tutorial") || path.includes("guide")) return "tutorial";
  return "conceptual";
}

function listDirs(path: string): string[] {
  try {
    return readdirSync(path).filter((name) => statSync(join(path, name)).isDirectory());
  } catch {
    return [];
  }
}

function listFiles(path: string, ext: string): string[] {
  try {
    return readdirSync(path)
      .filter((name) => extname(name) === ext)
      .map((name) => join(path, name));
  } catch {
    return [];
  }
}

function listFilesRecursive(path: string, ext: string): string[] {
  const results: string[] = [];
  function walk(dir: string) {
    try {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (extname(name) === ext) {
          results.push(full);
        }
      }
    } catch {
      // skip unreadable dirs
    }
  }
  walk(path);
  return results;
}

function exists(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}
