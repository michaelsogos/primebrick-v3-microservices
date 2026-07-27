/**
 * Embedding provider abstraction.
 *
 * Default: @huggingface/transformers (Xenova/all-MiniLM-L6-v2, 384-dim, CPU/WASM).
 * Pluggable: any OpenAI-compatible embeddings endpoint (set EMBEDDING_PROVIDER=openai).
 *
 * The provider is initialized once at startup and reused for all embedding calls.
 * The 384-dim vector is stored in docs_kb.embedding (vector(384) pgvector column).
 */

export interface EmbeddingProvider {
  /** Embed a single text and return a 384-dim float array. */
  embed(text: string): Promise<number[]>;
  /** Embed multiple texts in a batch. Returns array of 384-dim vectors. */
  embedBatch(texts: string[]): Promise<number[][]>;
  /** Dimension of the embedding vector (384 for all-MiniLM-L6-v2). */
  readonly dimension: number;
  /** Provider name for logging/metadata. */
  readonly name: string;
}

// ─── Transformers.js provider (default, CPU, zero API key) ───────────────────

class TransformersEmbeddingProvider implements EmbeddingProvider {
  readonly dimension = 384;
  readonly name = "transformers.js";
  private pipeline: ((text: string | string[], options?: object) => Promise<{ data: Float32Array }>) | null = null;
  private readonly model: string;

  constructor(model: string = "Xenova/all-MiniLM-L6-v2") {
    this.model = model;
  }

  private async getPipeline() {
    if (this.pipeline) return this.pipeline;
    const { pipeline, env } = await import("@huggingface/transformers");
    // Allow remote model download on first use, cache locally afterwards.
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    const extractor = await pipeline("feature-extraction", this.model);
    this.pipeline = extractor as unknown as typeof this.pipeline;
    return this.pipeline;
  }

  async embed(text: string): Promise<number[]> {
    const pipe = await this.getPipeline();
    const output = await pipe!(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const pipe = await this.getPipeline();
    const output = await pipe!(texts, { pooling: "mean", normalize: true });
    // transformers.js returns a single Float32Array for batch input — chunk it.
    const dim = this.dimension;
    const result: number[][] = [];
    for (let i = 0; i < texts.length; i++) {
      result.push(Array.from(output.data.slice(i * dim, (i + 1) * dim)));
    }
    return result;
  }
}

// ─── OpenAI-compatible provider (pluggable, for cloud embeddings) ────────────

class OpenAICompatibleEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai-compatible";
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  readonly dimension: number;

  constructor(opts: { baseUrl: string; apiKey: string; model: string; dimension: number }) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.apiKey = opts.apiKey;
    this.model = opts.model;
    this.dimension = opts.dimension;
  }

  private async callApi(texts: string[]): Promise<number[][]> {
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      throw new Error(`OpenAI-compatible embeddings failed: HTTP ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { data: Array<{ embedding: number[] }> };
    return json.data.map((d) => d.embedding);
  }

  async embed(text: string): Promise<number[]> {
    const [vec] = await this.callApi([text]);
    return vec;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.callApi(texts);
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

let cachedProvider: EmbeddingProvider | null = null;

/**
 * Get the configured embedding provider.
 *
 * Config (env vars):
 * - EMBEDDING_PROVIDER: "transformers" (default) | "openai"
 * - EMBEDDING_MODEL: model name (default: Xenova/all-MiniLM-L6-v2)
 * - EMBEDDING_BASE_URL: OpenAI-compatible base URL (for provider=openai)
 * - EMBEDDING_API_KEY: API key (for provider=openai)
 * - EMBEDDING_DIM: vector dimension (for provider=openai; transformers.js is always 384)
 */
export async function getEmbeddingProvider(): Promise<EmbeddingProvider> {
  if (cachedProvider) return cachedProvider;

  const providerType = (process.env.EMBEDDING_PROVIDER || "transformers").toLowerCase();

  if (providerType === "openai") {
    const baseUrl = process.env.EMBEDDING_BASE_URL;
    const apiKey = process.env.EMBEDDING_API_KEY;
    const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
    const dimension = parseInt(process.env.EMBEDDING_DIM || "384", 10);
    if (!baseUrl || !apiKey) {
      throw new Error("EMBEDDING_PROVIDER=openai requires EMBEDDING_BASE_URL and EMBEDDING_API_KEY");
    }
    cachedProvider = new OpenAICompatibleEmbeddingProvider({ baseUrl, apiKey, model, dimension });
  } else {
    const model = process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2";
    cachedProvider = new TransformersEmbeddingProvider(model);
  }

  return cachedProvider;
}
