/**
 * host-contract — the jobs page's view of `ctx.components` and
 * `ctx.mount_host`. Host values are opaque at this boundary (typed as the
 * shapes the remote consumes); the wire contract lives in
 * `@primebrick/ui`'s `ModulePageHost`.
 */
import type { Component, Snippet } from 'svelte';
import type {
  AdvancedFilter,
  EntityAction,
  EntityMetaResponse,
  FilterPreset,
  MetaColumn,
} from '@primebrick/ui';

/** Mirrors EntityListTable's cell-snippet args (host types.ts CellArgs). */
export type HostCellArgs<TRow extends Record<string, unknown>> = {
  row: TRow;
  column: MetaColumn;
  datetimeIanaModeByKey?: Record<string, 'browser' | 'record'>;
  datetimeIanaRenderTick?: number;
  sparklineData?: Record<string, { by_key: Record<string, unknown[]>; bucket_unit?: string }>;
};

/** The prop object pushed to the host EntityListTable via mount_host. */
export type EntityListTableHostProps<TRow extends Record<string, unknown>> = {
  entity?: string;
  translationKey?: string;
  /** Entity-label i18n namespace (`meta.entities_ns`) — forwarded to the
   *  host table so dialogs/sheets compose `<ns>.entities.*` keys. */
  entities_ns?: string;
  uid: string;
  columnOrderStorageKey?: string;
  columns: MetaColumn[];
  entityActions?: EntityAction[];
  rows: TRow[];
  total: bigint;
  metaLoading: boolean;
  rowsLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  search: string;
  onSearchInput: (value: string) => void;
  searchInKeys: string[] | null;
  onSearchInKeysChange: (keys: string[] | null) => void;
  sortKey: string | null;
  sortDir: 'asc' | 'desc';
  onSortChange: (key: string | null, dir: 'asc' | 'desc') => void;
  visibleKeys: string[];
  onVisibleKeysChange: (keys: string[]) => void;
  onResetColumnVisibility: () => void;
  selectedKeys: string[];
  onSelectedKeysChange: (keys: string[]) => void;
  defaultView?: 'table' | 'cards' | 'cards_list';
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  pageSizeOptions?: number[];
  filtersOpen?: boolean;
  filterValues?: Record<string, unknown>;
  advancedFilters?: AdvancedFilter[];
  onFilterValuesChange?: (values: Record<string, unknown>) => void;
  onAdvancedFiltersChange?: (filters: AdvancedFilter[], connector: 'AND' | 'OR') => void;
  onResetFilters?: () => void;
  onRefresh?: () => void;
  selectionLabelKey?: string;
  selectionLabelSingularKey?: string;
  cell?: Snippet<[HostCellArgs<TRow>]>;
  datetimeIanaModeByKey?: Record<string, 'browser' | 'record'>;
  datetimeIanaRenderTick?: number;
  /** Declared toolbar filter presets (`meta.table.filter_presets`). */
  filterPresets?: readonly FilterPreset[];
  /** Active option id per preset — resolved by the list engine. */
  presetSelections?: Record<string, string>;
  onPresetChange?: (presetId: string, optionId: string) => void;
  /** Batch-loaded sparkline buckets fed to `type:"sparkline"` cells. */
  sparklineData?: Record<string, { by_key: Record<string, unknown[]>; bucket_unit?: string }>;
};

export type BreadcrumbSegment = {
  label: string;
  href?: string;
  menu?: unknown;
} & Record<string, unknown>;

/** `ctx.components` for the jobs page — provided by the FE route shim. */
export type JobsComponents = {
  EntityListTable: Component<Record<string, unknown>>;
  AppPageBreadcrumb: Component<Record<string, unknown>>;
  /** Host Button — leaf-mounted via <HostLeaf> (ctx.mount_host). */
  Button: Component<Record<string, unknown>>;
  /**
   * HOST-owned `cell` snippet for EntityListTable — forwarded verbatim as
   * the table's `cell` prop. It runs inside host render (same bundle →
   * safe) and keeps only the `duration_ms` humanizer; `type:"sparkline"`
   * is a builtin cell fed by `sparklineData`.
   */
  jobs_cell: Snippet<[HostCellArgs<Record<string, unknown>>]>;
  settingsTabMenuSegment: (args: {
    pathname: string;
    searchParams: URLSearchParams;
    t: (key: string) => string;
  }) => unknown;
  onConnectivityRestored: (handler: (detail: { previous: string }) => void) => () => void;
};

export type { EntityMetaResponse };
