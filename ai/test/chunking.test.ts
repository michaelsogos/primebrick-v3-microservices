import { describe, it, expect } from "vitest";
import { chunkMarkdown, parseMdxFrontmatter } from "../src/services/chunking.js";

describe("chunkMarkdown", () => {
  it("should return single chunk for short content", () => {
    const content = "This is a short paragraph.";
    const chunks = chunkMarkdown(content);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].chunk_idx).toBe(0);
    expect(chunks[0].content).toBe("This is a short paragraph.");
  });

  it("should split by headings", () => {
    const content = "# Heading 1\n\nParagraph one.\n\n## Heading 2\n\nParagraph two.";
    const chunks = chunkMarkdown(content);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].content).toContain("Heading 1");
    expect(chunks[1].content).toContain("Heading 2");
  });

  it("should split long sections with overlap", () => {
    const longPara = "This is a sentence. ".repeat(200);
    const content = `# Section\n\n${longPara}`;
    const chunks = chunkMarkdown(content, 500, 100);
    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should be approximately within max size (plus overlap tolerance)
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(800);
    }
  });

  it("should assign sequential chunk_idx", () => {
    const content = "# H1\n\nPara 1\n\n# H2\n\nPara 2\n\n# H3\n\nPara 3";
    const chunks = chunkMarkdown(content);
    expect(chunks.map((c) => c.chunk_idx)).toEqual([0, 1, 2]);
  });
});

describe("parseMdxFrontmatter", () => {
  it("should parse frontmatter and body", () => {
    const content = "---\ntitle: My Page\ndescription: A test page\n---\n\n# Hello\n\nWorld";
    const { frontmatter, body } = parseMdxFrontmatter(content);
    expect(frontmatter.title).toBe("My Page");
    expect(frontmatter.description).toBe("A test page");
    expect(body).toContain("# Hello");
    expect(body).not.toContain("---");
  });

  it("should handle content without frontmatter", () => {
    const content = "# Just a heading\n\nNo frontmatter here.";
    const { frontmatter, body } = parseMdxFrontmatter(content);
    expect(frontmatter).toEqual({});
    expect(body).toBe(content);
  });

  it("should strip quotes from frontmatter values", () => {
    const content = '---\ntitle: "Quoted Title"\n---\n\nBody';
    const { frontmatter } = parseMdxFrontmatter(content);
    expect(frontmatter.title).toBe("Quoted Title");
  });
});
