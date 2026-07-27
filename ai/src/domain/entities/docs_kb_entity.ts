/**
 * docs_kb entity — knowledge base chunks with pgvector embedding.
 *
 * Each row is a chunk of documentation (MDX, OpenAPI spec, or auto-generated
 * reference doc) that has been embedded into a 384-dim vector for RAG retrieval.
 *
 * The table is created in the public schema (not the ai schema) because it is
 * shared with the BE for MCP entity registry access and vector search.
 */
import {
  Entity,
  Key,
  Column,
} from "@primebrick/dal-pg";

@Entity("docs_kb", "public")
export class DocsKbEntity {
  @Key()
  id!: bigint;

  @Column({ length: 50, nullable: false })
  repo!: string;

  @Column({ nullable: false })
  path!: string;

  @Column({ nullable: false })
  title!: string;

  @Column({ nullable: false })
  chunk_idx!: number;

  @Column({ nullable: false, pgType: "text" })
  content!: string;

  // vector(384) — stored as string for DAL compatibility, queried via raw SQL.
  // The DAL does not natively support pgvector types; vector search is done
  // via raw SQL in the DocsKbRepository.
  @Column({ nullable: false, pgType: "text" })
  embedding!: string;

  @Column({ nullable: false, pgType: "jsonb" })
  metadata!: object;

  @Column({ nullable: false })
  content_hash!: string;

  @Column({ nullable: false })
  created_at!: Date;

  @Column({ nullable: false })
  updated_at!: Date;
}
