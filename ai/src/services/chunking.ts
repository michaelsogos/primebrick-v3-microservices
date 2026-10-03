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

  const emit = (text: string, heading_path?: string) => {
    const trimmed = text.trim();
    if (trimmed) {
      chunks.push({
        content: trimmed,
        chunk_idx: chunkIdx++,
        metadata: heading_path ? { heading_path } : {},
      });
    }
  };

  // Sentence-split a unit that exceeds maxChars (used for both oversized
  // paragraphs and oversized atomic bullets).
  const emitOversized = (text: string, heading_path?: string) => {
    const sentences = text.split(/(?<=[.!?])\s+/);
    let sentBuf = "";
    for (const sent of sentences) {
      if (sentBuf && (sentBuf + " " + sent).length <= maxChars) {
        sentBuf = sentBuf + " " + sent;
      } else if (!sentBuf && sent.length <= maxChars) {
        sentBuf = sent;
      } else {
        if (sentBuf) emit(sentBuf, heading_path);
        if (sent.length > maxChars) {
          for (let i = 0; i < sent.length; i += maxChars - overlapChars) {
            emit(sent.slice(i, i + maxChars), heading_path);
          }
          sentBuf = "";
        } else {
          sentBuf = sent;
        }
      }
    }
    if (sentBuf) emit(sentBuf, heading_path);
  };

  for (const section of splitByHeadings(content)) {
    let current = "";
    const flush = () => {
      emit(current, section.heading_path);
      current = "";
    };

    for (const unit of splitUnits(section.text)) {
      // Bullet lines are atomic facts — merging them dilutes the vector.
      if (unit.atomic) {
        flush();
        emitOversized(unit.text, section.heading_path);
        continue;
      }
      if (current && (current + "\n\n" + unit.text).length <= maxChars) {
        current = current + "\n\n" + unit.text;
      } else if (!current && unit.text.length <= maxChars) {
        current = unit.text;
      } else {
        const overlap = current ? current.slice(-overlapChars) : "";
        flush();
        if (unit.text.length <= maxChars) {
          current = overlap ? overlap + "\n\n" + unit.text : unit.text;
        } else {
          emitOversized(unit.text, section.heading_path);
        }
      }
    }
    flush();
  }

  return chunks.filter((c) => c.content.length > 0);
}

interface Section {
  heading_path?: string;
  text: string;
}

/**
 * Split markdown by headings, tracking the heading hierarchy so every
 * section knows its full path ("Users List > Actions > Row actions").
 * The heading line is kept inside the section text as context.
 */
function splitByHeadings(content: string): Section[] {
  const sections: Section[] = [];
  const stack: Array<{ level: number; text: string }> = [];
  let current: string[] = [];

  const flush = () => {
    if (current.some((l) => l.trim())) {
      sections.push({
        heading_path: stack.length ? stack.map((s) => s.text).join(" > ") : undefined,
        text: current.join("\n"),
      });
    }
    current = [];
  };

  for (const line of content.split("\n")) {
    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (m) {
      flush();
      const level = m[1].length;
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      stack.push({ level, text: m[2].trim() });
      current = [line];
    } else {
      current.push(line);
    }
  }
  flush();
  return sections;
}

interface Unit {
  text: string;
  /** Atomic units become standalone chunks (never merged with neighbours). */
  atomic: boolean;
}

/**
 * Split section text into units: blank-line paragraphs plus one atomic unit
 * per list bullet line. Bullet lines are standalone facts (semantic digest
 * rows, feature lists) — embedding them separately keeps each vector sharp.
 */
function splitUnits(text: string): Unit[] {
  const units: Unit[] = [];
  for (const para of text.split(/\n\n+/)) {
    let textBuf: string[] = [];
    const flushText = () => {
      const t = textBuf.join("\n").trim();
      if (t) units.push({ text: t, atomic: false });
      textBuf = [];
    };
    for (const line of para.split("\n")) {
      if (/^\s*[-*]\s+/.test(line)) {
        flushText();
        units.push({ text: line.trim(), atomic: true });
      } else {
        textBuf.push(line);
      }
    }
    flushText();
  }
  return units;
}

export function buildEmbeddingInput(
  title: string,
  heading_path: string | undefined,
  content: string,
): string {
  return [title, heading_path, content].filter(Boolean).join("\n\n");
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
  const normalized = content.replace(/\r\n?/g, "\n");
  let body = normalized;

  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
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
