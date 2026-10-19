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
  MetaColumn,
} from '@primebrick/ui';

/** Mirrors EntityListTable's cell-snippet args (host types.ts CellArgs). */
export type HostCellArgs<TRow extends Record<string, unknown>> = {
  row: TRow;
  column: MetaColumn;
  datetimeIanaModeByKey?: Record<string, 'browser' | 'record'>;
  datetimeIanaRenderTick?: number;
};

/** The prop object pushed to the host EntityListTable via mount_host. */
export type EntityListTableHostProps<TRow extends Record<string, unknown>> = {
  entity?: string;
  translationKey?: string;
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
};

export type HostButtonArgs = {
  label: string;
  onclick: () => void;
  disabled?: boolean;
  variant?: string;
  size?: string;
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
  settingsTabMenuSegment: (args: {
    pathname: string;
    searchParams: URLSearchParams;
    t: (key: string) => string;
  }) => unknown;
  onConnectivityRestored: (handler: (detail: { previous: string }) => void) => () => void;
  /** Standard TableCell fallback for remote `cell` overrides. */
  default_cell: Snippet<[HostCellArgs<Record<string, unknown>>]>;
  /** Host Button leaf — keeps module CTAs identical to app chrome. */
  host_button: Snippet<[HostButtonArgs]>;
};

export type { EntityMetaResponse };
