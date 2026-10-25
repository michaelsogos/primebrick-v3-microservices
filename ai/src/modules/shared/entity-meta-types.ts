/**
 * Minimal `EntityMeta`/`MetaColumn` contract for US-served entity meta.
 *
 * Mirrors the BE's `http/entity-meta.types.ts` field-for-field for the
 * subset these entities declare — the meta JSON is a wire contract with
 * the FE (list tables, column pickers, badges), not a transport DTO.
 */

export type MetaColumnType =
  | "text"
  | "badge"
  | "boolean"
  | "color"
  | "datetime"
  | "number";

export interface MetaColumn {
  /** Entity field key — must match the DTO/entity property name. */
  key: string;
  /** i18n key for the column/field label. */
  label_key: string;
  type: MetaColumnType;
  /** Deterministic display position. */
  order: number;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  default_visible?: boolean;
  sticky?: boolean;
  hideable?: boolean;
  audited?: boolean;
  badge?: {
    values: Record<string, { label_key: string; color: string }>;
  };
}

export interface EntityMeta {
  entity: string;
  translation_key: string;
  /** Entity-label i18n namespace — FE composes `<entities_ns>.entities.*`
   *  (module-owned entities declare their module code; absent = `system`). */
  entities_ns?: string;
  title_key: string;
  uid: string;
  display_field: string;
  display_name?: string;
  columns: MetaColumn[];
  table?: {
    default_view: "table" | "cards" | "cards_list";
    default_sort?: { key: string; dir: "asc" | "desc" };
    default_page_size?: number;
    page_size_options?: number[];
  };
  actions_overrides?: Record<string, { enabled?: boolean }>;
}
