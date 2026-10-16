/**
 * docs_kb entity — knowledge base chunks with pgvector embedding.
 *
 * Each row is a chunk of documentation (MDX, OpenAPI spec, or auto-generated
 * reference doc) that has been embedded into a vector for RAG retrieval.
 *
 * The table lives in the `ai` schema — schema sovereignty: ai owns its RAG
 * knowledge base end-to-end (BE/MCP reach it through ai's API surface).
 */
import {
  Entity,
  Key,
  Unique,
  Index,
  Column,
  Vector,
} from "@primebrick/dal-pg";

@Entity("docs_kb", "ai")
export class DocsKbEntity {
  @Key()
  id!: bigint;

  /** Chunk identity — UNIQUE(repo, path, chunk_idx) in DDL. matchBy selector
   *  for update/hardDelete bulk ops. */
  @Unique("docs_kb_repo_path_chunk_idx_uq", 0)
  @Index()
  @Column({ length: 50, nullable: false })
  repo!: string;

  @Unique("docs_kb_repo_path_chunk_idx_uq", 1)
  @Column({ nullable: false })
  path!: string;

  @Column({ nullable: false })
  title!: string;

  @Unique("docs_kb_repo_path_chunk_idx_uq", 2)
  @Column({ pgType: "int4", nullable: false })
  chunk_idx!: number;

  @Column({ nullable: false })
  content!: string;

  // vector(1024) — `Vector` is runtime-identifiable number[]; the DAL binds
  // it as the '[v1,v2,…]' literal on write and hydrates it on read. `jsType`
  // is the runtime hydration marker (a bare `Vector` annotation is invisible
  // at runtime — without it a jsonb round-trip would surface a raw string).
  @Index({ using: "hnsw", opclass: "vector_cosine_ops" })
  @Column({ nullable: false, length: 1024, jsType: "vector" })
  embedding!: Vector;

  @Column({ nullable: false })
  metadata!: object;

  @Index()
  @Column({ nullable: false })
  content_hash!: string;

  @Column({ nullable: false })
  created_at!: Date;

  @Column({ nullable: false })
  updated_at!: Date;
}
