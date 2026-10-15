/**
 * Embedding provider abstraction.
 *
 * Default: @huggingface/transformers (Xenova/paraphrase-multilingual-MiniLM-L12-v2,
 * 384-dim, CPU/WASM) — multilingual: Italian queries retrieve English docs
 * directly, without depending on the rewrite step.
 * Pluggable: any OpenAI-compatible embeddings endpoint (set EMBEDDING_PROVIDER=openai).
 *
 * The provider is initialized once at startup and reused for all embedding calls.
 * The 384-dim vector is stored in docs_kb.embedding (vector(384) pgvector column).
 */

import { aiConfig } from "../config/ai-config.js";

export type EmbedKind = "query" | "passage";

export interface EmbeddingProvider {
  /** Embed a single passage/document text. */
  embed(text: string): Promise<number[]>;
  /** Embed multiple passage/document texts in a batch. */
  embedBatch(texts: string[]): Promise<number[][]>;
  /** Embed a single query text — instruct embedding models (e5-instruct,
   *  bge, Qwen3-Embedding) require a different prefix on the query side
   *  than on the passage side; asymmetric retrieval depends on it. */
  embedQuery(text: string): Promise<number[]>;
  /** Dimension of the embedding vector — resolved from the model output
   *  at first call (was hardcoded 384, which broke batch slicing and the
   *  pgvector column shape on non-384 models). */
  readonly dimension: number;
  /** Provider name for logging/metadata. */
  readonly name: string;
}

// ─── Transformers.js provider (default, CPU, zero API key) ───────────────────

class TransformersEmbeddingProvider implements EmbeddingProvider {
  // Dimension is measured from the first real output — hardcoding it was
  // the bug that made batch slicing and the pgvector column size wrong on
  // non-384 models (e5/bge/Qwen3-Embedding are 768–1024).
  private _dimension = 0;
  get dimension() {
    return this._dimension;
  }
  // The model id is part of the name: embeddings from different models are
  // incompatible vector spaces, so the identity must invalidate hashes.
  get name() {
    return `transformers.js:${this.model}`;
  }
  private pipeline: ((text: string | string[], options?: object) => Promise<{ data: Float32Array }>) | null = null;
  private readonly model: string;
  /** Instruct-style embedding models expect asymmetric prefixes
   *  ("query: …" / "passage: …" for e5-instruct, different for bge-m3).
   *  Auto-detected from the model id; overridable via env. */
  private readonly queryPrefix: string;
  private readonly passagePrefix: string;

  constructor(model: string = "Xenova/paraphrase-multilingual-MiniLM-L12-v2") {
    this.model = model;
    // e5-instruct wants "Instruct: <task>\nQuery: <q>" on the query side and
    // the raw passage on the doc side (HF model card, lmo3 ONNX export).
    const isE5Instruct = /e5.*instruct/i.test(model);
    const instruct = isE5Instruct || /bge-m3|qwen3-embedding/i.test(model);
    this.queryPrefix =
      aiConfig("embedding_query_prefix") ??
      (isE5Instruct ? "Instruct: Retrieve relevant documentation passages.\nQuery: " : instruct ? "query: " : "");
    this.passagePrefix =
      aiConfig("embedding_passage_prefix") ??
      (isE5Instruct ? "" : instruct ? "passage: " : "");
  }

  private async getPipeline() {
    if (this.pipeline) return this.pipeline;
    const { pipeline, env } = await import("@huggingface/transformers");
    // Prefer the local model cache (offline/dev), remote download as fallback
    // on first use when the model isn't cached yet. embedding_local_only=true
    // disables remote access entirely.
    env.allowLocalModels = true;
    env.allowRemoteModels = aiConfig("embedding_local_only") !== "true";
    const extractor = await pipeline("feature-extraction", this.model, {
      // q8 keeps the CPU footprint sane on >500M models (e5-large int8 ≈535MB);
      // overridable via config for quality experiments.
      dtype: (aiConfig("embedding_dtype") ?? "q8") as "q8",
    });
    this.pipeline = extractor as unknown as typeof this.pipeline;
    return this.pipeline;
  }

  private async run(texts: string[]): Promise<number[][]> {
    const pipe = await this.getPipeline();
    const output = await pipe!(texts, { pooling: "mean", normalize: true });
    const dim = output.data.length / texts.length;
    if (!Number.isInteger(dim)) throw new Error(`Embedding output size ${output.data.length} not divisible by batch ${texts.length}`);
    if (this._dimension === 0) this._dimension = dim;
    const result: number[][] = [];
    for (let i = 0; i < texts.length; i++) {
      result.push(Array.from(output.data.slice(i * dim, (i + 1) * dim)));
    }
    return result;
  }

  async embed(text: string): Promise<number[]> {
    const [vec] = await this.run([this.passagePrefix + text]);
    return vec;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.run(texts.map((t) => this.passagePrefix + t));
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vec] = await this.run([this.queryPrefix + text]);
    return vec;
  }
}

// ─── OpenAI-compatible provider (pluggable, for cloud embeddings) ────────────

class OpenAICompatibleEmbeddingProvider implements EmbeddingProvider {
  get name() {
    return `openai-compatible:${this.model}`;
  }
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
      // standards-exempt: ext-json — OpenAI-compatible embeddings API wire format is plain JSON
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

  async embedQuery(text: string): Promise<number[]> {
    // Server-side embedding endpoints own the prompt format — pass through.
    const [vec] = await this.callApi([text]);
    return vec;
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

let cachedProvider: EmbeddingProvider | null = null;

/**
 * Get the configured embedding provider.
 *
 * Config (ai.config_entries — env-policy: no env vars besides DATABASE_URL):
 * - embedding_provider: "transformers" (default) | "openai"
 * - embedding_model: model name (default: lmo3/multilingual-e5-large-instruct)
 * - embedding_base_url: OpenAI-compatible base URL (for provider=openai)
 * - embedding_api_key: API key (for provider=openai)
 * - embedding_dim: vector dimension (provider=openai only; transformers.js
 *   measures it from the first real output)
 * - embedding_query_prefix / embedding_passage_prefix: instruct-model
 *   prefixes (auto-detected for e5/bge/qwen3-embedding ids)
 */
export async function getEmbeddingProvider(): Promise<EmbeddingProvider> {
  if (cachedProvider) return cachedProvider;

  const providerType = (aiConfig("embedding_provider") ?? "transformers").toLowerCase();

  if (providerType === "openai") {
    const baseUrl = aiConfig("embedding_base_url");
    const apiKey = aiConfig("embedding_api_key");
    const model = aiConfig("embedding_model") ?? "text-embedding-3-small";
    const dimension = parseInt(aiConfig("embedding_dim") ?? "384", 10);
    if (!baseUrl || !apiKey) {
      throw new Error("embedding_provider=openai requires embedding_base_url and embedding_api_key in ai.config_entries");
    }
    cachedProvider = new OpenAICompatibleEmbeddingProvider({ baseUrl, apiKey, model, dimension });
  } else {
    const model = aiConfig("embedding_model") ?? "lmo3/multilingual-e5-large-instruct";
    cachedProvider = new TransformersEmbeddingProvider(model);
  }

  return cachedProvider;
}
