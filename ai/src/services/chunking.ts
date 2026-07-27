/**
 * Text chunking for RAG embedding.
 *
 * Strategy: sentence-aware splitting with overlap.
 * - Split by markdown headings first (preserves semantic boundaries).
 * - Within each section, split by paragraphs, then by sentences if a chunk
 *   exceeds the max size.
 * - Overlap between chunks to preserve context across boundaries.
 *
 * Default: 512 tokens max, 64 tokens overlap (~256 chars/token for English).
 * For all-MiniLM-L6-v2, 512 tokens is the max sequence length (truncated if longer).
 */

export interface Chunk {
  content: string;
  chunk_idx: number;
  metadata: Record<string, unknown>;
}

const DEFAULT_MAX_CHARS = 1800; // ~512 tokens (avg 3.5 chars/token for English)
const DEFAULT_OVERLAP_CHARS = 200; // ~64 tokens

/**
 * Chunk a markdown document into semantically coherent pieces.
 *
 * @param content The full markdown content (with frontmatter already stripped).
 * @param maxChars Maximum chars per chunk (default 1800 ≈ 512 tokens).
 * @param overlapChars Overlap chars between consecutive chunks (default 200 ≈ 64 tokens).
 * @returns Array of chunks with chunk_idx starting at 0.
 */
export function chunkMarkdown(
  content: string,
  maxChars: number = DEFAULT_MAX_CHARS,
  overlapChars: number = DEFAULT_OVERLAP_CHARS,
): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkIdx = 0;

  // Split by markdown headings (## or ### or #)
  const sections = splitByHeadings(content);

  for (const section of sections) {
    if (section.length <= maxChars) {
      chunks.push({ content: section.trim(), chunk_idx: chunkIdx++, metadata: {} });
      continue;
    }

    // Section too long — split by paragraphs
    const paragraphs = section.split(/\n\n+/);
    let current = "";

    for (const para of paragraphs) {
      if (current && (current + "\n\n" + para).length <= maxChars) {
        current = current + "\n\n" + para;
      } else if (!current && para.length <= maxChars) {
        current = para;
      } else {
        // Flush current if set
        if (current) {
          chunks.push({ content: current.trim(), chunk_idx: chunkIdx++, metadata: {} });
        }
        // If paragraph itself fits (with overlap), start new chunk with it
        if (para.length <= maxChars) {
          const overlap = current ? current.slice(-overlapChars) : "";
          current = overlap ? overlap + "\n\n" + para : para;
        } else {
          // Paragraph exceeds maxChars — split by sentences
          const sentences = para.split(/(?<=[.!?])\s+/);
          let sentBuf = "";
          for (const sent of sentences) {
            if (sentBuf && (sentBuf + " " + sent).length <= maxChars) {
              sentBuf = sentBuf + " " + sent;
            } else if (!sentBuf && sent.length <= maxChars) {
              sentBuf = sent;
            } else {
              if (sentBuf) {
                chunks.push({ content: sentBuf.trim(), chunk_idx: chunkIdx++, metadata: {} });
              }
              // If single sentence exceeds maxChars, hard-split it
              if (sent.length > maxChars) {
                for (let i = 0; i < sent.length; i += maxChars - overlapChars) {
                  const slice = sent.slice(i, i + maxChars);
                  if (slice.trim()) {
                    chunks.push({ content: slice.trim(), chunk_idx: chunkIdx++, metadata: {} });
                  }
                }
                sentBuf = "";
              } else {
                sentBuf = sent;
              }
            }
          }
          current = sentBuf;
        }
      }
    }

    if (current) {
      chunks.push({ content: current.trim(), chunk_idx: chunkIdx++, metadata: {} });
    }
  }

  return chunks.filter((c) => c.content.length > 0);
}

/**
 * Split markdown by headings, preserving the heading line in each section.
 */
function splitByHeadings(content: string): string[] {
  const lines = content.split("\n");
  const sections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^#{1,6}\s/.test(line)) {
      // New heading — flush current section
      if (current.length > 0) {
        sections.push(current.join("\n"));
      }
      current = [line];
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    sections.push(current.join("\n"));
  }

  return sections;
}

/**
 * Parse MDX frontmatter and return { frontmatter, body }.
 * Frontmatter is the YAML block between --- markers at the start of the file.
 */
export function parseMdxFrontmatter(content: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const frontmatter: Record<string, string> = {};
  let body = content;

  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (match) {
    const yamlBlock = match[1];
    body = match[2];

    for (const line of yamlBlock.split("\n")) {
      const fmMatch = line.match(/^(\w+):\s*(.*)$/);
      if (fmMatch) {
        const [, key, value] = fmMatch;
        // Strip quotes if present
        frontmatter[key] = value.replace(/^["']|["']$/g, "");
      }
    }
  }

  return { frontmatter, body };
}
