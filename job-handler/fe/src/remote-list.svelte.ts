/**
 * remote-list — entity list state machine for remote module pages.
 *
 * Remote-owned mirror of the host's useEntityList: same wire contract
 * (search/search_in/sort_key/sort_dir/page/page_size/filters[i][…]) driven
 * through ctx.api, same persisted view prefs (sessionStorage), same
 * debounce/gate semantics — implemented on remote-bundle runes so no host
 * reactive state crosses the boundary.
 *
 * Canonical helpers (orderedColumns, defaultVisibleColumnKeys, search gate,
 * filter serializer, ext-json codec) come from the bundled @primebrick/ui —
 * the wire format cannot drift.
 */
import {
  appendListFilterParams,
  defaultSearchGate,
  defaultVisibleColumnKeys,
  extJsonParse,
  orderedColumns,
  sanitizeVisibleKeys,
  searchableTextColumns,
  type AdvancedFilter,
  type EntityMetaResponse,
  type ListResponse,
  type MetaColumn,
  type ModulePageHost,
} from '@primebrick/ui';

export interface RemoteFixedFilter {
  field: string;
  op: string;
  value: string;
}

export interface RemoteEntityListOptions<TRow extends Record<string, unknown>> {
  ctx: ModulePageHost;
  /** Service-relative entity base — e.g. `/api/v1/entities/job_schedule`. */
  basePath: string;
  /** sessionStorage prefix for persisted list prefs (e.g. `pb:jobs:runs:`). */
  storageKeyPrefix: string;
  /** Always-on server filters occupying filters[0..n-1]. */
  fixedFilters?: RemoteFixedFilter[];
  /** Called after every successful rows load (e.g. sparkline enrichment). */
  onRowsLoaded?: (rows: TRow[]) => void;
  /** Scope key for list-error notifications. */
  errorScopeKey?: string;
}

type DeletionFilterMode = 'non_deleted' | 'deleted' | 'all';
type SortDir = 'asc' | 'desc';

const SEARCH_DEBOUNCE_MS = 350;
const FETCH_TIMEOUT_MS = 30_000;

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}

/** ctx.api + caller signal + timeout — the remote's fetch primitive. */
async function apiWithTimeout(
  ctx: ModulePageHost,
  path: string,
  init: RequestInit | undefined,
  timeoutMs: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const tmo = setTimeout(() => ctrl.abort(), timeoutMs);
  const externalSignal = init?.signal;
  if (externalSignal) {
    if (externalSignal.aborted) ctrl.abort();
    else externalSignal.addEventListener('abort', () => ctrl.abort(), { once: true });
  }
  try {
    return await ctx.api(path, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(tmo);
  }
}

export function useRemoteEntityList<TRow extends Record<string, unknown>>(
  opts: RemoteEntityListOptions<TRow>,
) {
  const t = (key: string, params?: Record<string, unknown>) => opts.ctx.i18n.t(key, params);
  const notify = (input: Parameters<ModulePageHost['notify']>[0]) => opts.ctx.notify(input);

  const _state = $state({
    meta: null as EntityMetaResponse | null,
    rows: [] as TRow[],
    loading: true,
    error: null as string | null,

    search: '',
    appliedSearch: '',

    sortKey: null as string | null,
    sortDir: 'asc' as SortDir,

    page: 1,
    pageSize: 25,
    total: 0n as bigint,

    filterValues: {} as Record<string, unknown>,
    advancedFilters: [] as AdvancedFilter[],
    globalConnector: 'AND' as 'AND' | 'OR',
    filtersOpen: false,

    visibleKeys: [] as string[],
    selectedKeys: [] as string[],
    searchInKeys: null as string[] | null,

    deletionFilterMode: 'non_deleted' as DeletionFilterMode,

    bootstrapped: false,
  });

  const columns = $derived(orderedColumns(_state.meta?.columns));
  const metaLoaded = $derived(!!_state.meta);
  const metaLoading = $derived(!metaLoaded && _state.loading);
  const rowsLoading = $derived(metaLoaded && _state.loading);
  const viewMode = $derived(_state.meta?.table?.default_view ?? 'table');
  const defaultSortKey = $derived(_state.meta?.table?.default_sort?.key ?? null);
  const defaultSortDir = $derived(_state.meta?.table?.default_sort?.dir ?? ('asc' as const));
  const effectiveSearchInKeys = $derived(
    _state.searchInKeys && _state.searchInKeys.length
      ? _state.searchInKeys
      : searchableTextColumns(columns)
          .filter((c) => _state.visibleKeys.includes(c.key))
          .map((c) => c.key),
  );

  const skVisibleKeys = `${opts.storageKeyPrefix}visibleKeys`;
  const skSearchInKeys = `${opts.storageKeyPrefix}searchInKeys`;
  const skColumnOrder = `${opts.storageKeyPrefix}columnOrder`;
  const skSort = `${opts.storageKeyPrefix}sort`;
  const skFilterValues = `${skColumnOrder}:filterValues`;
  const skAdvancedFilters = `${skColumnOrder}:advancedFilters`;

  function storageGet(key: string): string | null {
    try {
      return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  function storageSet(key: string, value: string): void {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // quota / blocked storage — prefs are best-effort
    }
  }

  let stateRestored = false;
  let sortRestored = false;

  function restorePersistentState() {
    if (stateRestored) return;
    stateRestored = true;
    try {
      const sk = storageGet(skSort);
      if (sk) {
        const parsed = JSON.parse(sk) as { key?: unknown; dir?: unknown };
        if (
          parsed &&
          typeof parsed === 'object' &&
          (parsed.key === null || typeof parsed.key === 'string') &&
          (parsed.dir === 'asc' || parsed.dir === 'desc')
        ) {
          _state.sortKey = parsed.key as string | null;
          _state.sortDir = parsed.dir;
          sortRestored = true;
        }
      }
      const vk = storageGet(skVisibleKeys);
      if (vk) {
        const parsed = JSON.parse(vk) as unknown;
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
          _state.visibleKeys = parsed;
        }
      }
      const sik = storageGet(skSearchInKeys);
      if (sik) {
        const parsed = JSON.parse(sik) as unknown;
        if (parsed === null || (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string'))) {
          _state.searchInKeys = parsed;
        }
      }
      const fv = storageGet(skFilterValues);
      if (fv) {
        const parsed = JSON.parse(fv) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          _state.filterValues = parsed as Record<string, unknown>;
        }
      }
      const af = storageGet(skAdvancedFilters);
      if (af) {
        const parsed = JSON.parse(af) as unknown;
        if (Array.isArray(parsed)) {
          _state.advancedFilters = parsed as AdvancedFilter[];
        }
      }
    } catch {
      // bad storage payloads are ignored — prefs are best-effort
    }
  }

  function persistState() {
    storageSet(skSort, JSON.stringify({ key: _state.sortKey, dir: _state.sortDir }));
    storageSet(skVisibleKeys, JSON.stringify(_state.visibleKeys));
    storageSet(skSearchInKeys, JSON.stringify(_state.searchInKeys));
    storageSet(skFilterValues, JSON.stringify(_state.filterValues));
    storageSet(skAdvancedFilters, JSON.stringify(_state.advancedFilters));
  }

  $effect(() => {
    if (!metaLoaded) return;
    void _state.visibleKeys;
    void _state.searchInKeys;
    void _state.sortKey;
    void _state.sortDir;
    void _state.filterValues;
    void _state.advancedFilters;
    persistState();
  });

  // ── fetch pipeline ───────────────────────────────────────────────────

  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  let activeListController: AbortController | null = null;

  function ensureVisibleKeys() {
    if (_state.visibleKeys.length === 0 && columns.length) {
      _state.visibleKeys = defaultVisibleColumnKeys(columns);
      return;
    }
    if (!columns.length) return;
    _state.visibleKeys = sanitizeVisibleKeys(_state.visibleKeys, columns);
  }

  function applyMetaDefaults() {
    const defSort = _state.meta?.table?.default_sort;
    if (!sortRestored && _state.sortKey === null) {
      _state.sortKey = defSort?.key ?? null;
      _state.sortDir = defSort?.dir ?? 'asc';
    }
    _state.pageSize = _state.meta?.table?.default_page_size ?? _state.pageSize;
    ensureVisibleKeys();
  }

  async function loadMeta() {
    if (_state.meta) return;
    const res = await apiWithTimeout(opts.ctx, `${opts.basePath}/meta`, undefined, FETCH_TIMEOUT_MS);
    if (!res.ok) throw new Error(`META_FAILED:${res.status}`);
    _state.meta = extJsonParse<EntityMetaResponse>(await res.text());
    applyMetaDefaults();
  }

  async function loadRows() {
    activeListController?.abort();
    const controller = new AbortController();
    activeListController = controller;

    const qs = new URLSearchParams();
    const applied = _state.appliedSearch.trim();
    if (applied) qs.set('search', applied);
    if (applied && effectiveSearchInKeys.length > 0) {
      qs.set('search_in', effectiveSearchInKeys.join(','));
    }

    const effSortKey = _state.sortKey ?? defaultSortKey;
    const effSortDir = _state.sortKey ? _state.sortDir : defaultSortDir;
    if (effSortKey) qs.set('sort_key', effSortKey);
    if (effSortKey || _state.sortKey) qs.set('sort_dir', effSortDir);

    qs.set('page', String(_state.page));
    qs.set('page_size', String(_state.pageSize));

    let fi = 0;
    for (const f of opts.fixedFilters ?? []) {
      qs.set(`filters[${fi}][field]`, f.field);
      qs.set(`filters[${fi}][op]`, f.op);
      qs.set(`filters[${fi}][value]`, f.value);
      qs.set(`filters[${fi}][connector]`, 'AND');
      fi++;
    }
    appendListFilterParams(
      qs,
      {
        filterValues: _state.filterValues,
        columns: columns as MetaColumn[],
        advancedFilters: _state.advancedFilters,
        connector: _state.globalConnector,
      },
      fi,
    );

    // Job entities have no soft-delete — `deleted_records` is skipped.
    const res = await apiWithTimeout(
      opts.ctx,
      `${opts.basePath}/list?${qs.toString()}`,
      { signal: controller.signal },
      FETCH_TIMEOUT_MS,
    );
    if (!res.ok) throw new Error(`LIST_FAILED:${res.status}`);
    const data = extJsonParse<ListResponse<TRow>>(await res.text());
    _state.rows = data.rows;
    _state.total = data.total;
    _state.page = Number(data.page);
    _state.pageSize = Number(data.page_size);
    opts.onRowsLoaded?.(_state.rows);
  }

  function handleLoadError(e: unknown) {
    _state.error = t('app.common.loadFailed');
    const status = /:(\d+)$/.exec(e instanceof Error ? e.message : '')?.[1];
    notify({
      impact: 'HIGH',
      messageKey: 'app.common.loadFailed',
      scopeKey: opts.errorScopeKey,
      detail: e instanceof Error ? e.message : String(e),
      toast: false,
      ...(status ? { tags: [{ label: `HTTP ${status}`, tone: 'danger' }] } : {}),
    });
  }

  async function refreshRows(refreshOpts?: { clampPage?: boolean }) {
    if (!_state.bootstrapped) return;
    _state.loading = true;
    _state.error = null;
    try {
      await loadRows();
      if (refreshOpts?.clampPage) {
        const maxPages = Math.max(1, Math.ceil(Number(_state.total) / _state.pageSize));
        if (_state.page > maxPages) {
          _state.page = 1;
          await loadRows();
        }
      }
    } catch (e) {
      if (isAbortError(e)) return;
      handleLoadError(e);
    } finally {
      _state.loading = false;
    }
  }

  async function init() {
    _state.loading = true;
    _state.error = null;
    restorePersistentState();
    try {
      await loadMeta();
      await loadRows();
      const maxPages = Math.max(1, Math.ceil(Number(_state.total) / _state.pageSize));
      if (_state.page > maxPages) {
        _state.page = 1;
        await loadRows();
      }
    } catch (e) {
      if (!isAbortError(e)) handleLoadError(e);
    } finally {
      _state.loading = false;
      _state.bootstrapped = true;
    }
  }

  // ── public surface (mirrors useEntityList) ────────────────────────────

  return {
    get meta() {
      return _state.meta;
    },
    get rows() {
      return _state.rows;
    },
    get error() {
      return _state.error;
    },
    get search() {
      return _state.search;
    },
    get sortKey() {
      return _state.sortKey;
    },
    get sortDir() {
      return _state.sortDir;
    },
    get page() {
      return _state.page;
    },
    get pageSize() {
      return _state.pageSize;
    },
    get total() {
      return _state.total;
    },
    get filterValues() {
      return _state.filterValues;
    },
    get advancedFilters() {
      return _state.advancedFilters;
    },
    get filtersOpen() {
      return _state.filtersOpen;
    },
    get visibleKeys() {
      return _state.visibleKeys;
    },
    get selectedKeys() {
      return _state.selectedKeys;
    },
    get searchInKeys() {
      return _state.searchInKeys;
    },
    get columns() {
      return columns;
    },
    get metaLoading() {
      return metaLoading;
    },
    get rowsLoading() {
      return rowsLoading;
    },
    get viewMode() {
      return viewMode;
    },

    init,
    refreshRows,

    onPageChange(p: number) {
      _state.page = p;
      void refreshRows();
    },
    onPageSizeChange(ps: number) {
      _state.pageSize = ps;
      _state.page = 1;
      void refreshRows({ clampPage: true });
    },
    onSearchInput(value: string) {
      _state.search = value;
      if (searchTimer) clearTimeout(searchTimer);
      const trimmed = value.trim();
      const shouldReset = trimmed.length === 0;
      const shouldSearch = defaultSearchGate(trimmed);
      if (!shouldReset && !shouldSearch) return;
      searchTimer = setTimeout(() => {
        _state.appliedSearch = _state.search.trim();
        _state.page = 1;
        void refreshRows({ clampPage: true });
      }, SEARCH_DEBOUNCE_MS);
    },
    onSearchInKeysChange(keys: string[] | null) {
      _state.searchInKeys = keys;
      if (_state.appliedSearch.trim()) {
        _state.page = 1;
        void refreshRows({ clampPage: true });
      }
    },
    onSortChange(key: string | null, dir: SortDir) {
      _state.sortKey = key;
      _state.sortDir = dir;
      _state.page = 1;
      void refreshRows({ clampPage: true });
    },
    onVisibleKeysChange(keys: string[]) {
      _state.visibleKeys = keys;
    },
    onResetColumnVisibility() {
      if (columns.length) _state.visibleKeys = defaultVisibleColumnKeys(columns);
    },
    onSelectedKeysChange(keys: string[]) {
      _state.selectedKeys = keys;
    },
    onFilterValuesChange(values: Record<string, unknown>) {
      _state.filterValues = values;
      _state.page = 1;
      void refreshRows({ clampPage: true });
    },
    onAdvancedFiltersChange(filters: AdvancedFilter[], connector: 'AND' | 'OR' = 'AND') {
      _state.advancedFilters = filters;
      _state.globalConnector = connector;
      _state.page = 1;
      void refreshRows({ clampPage: true });
    },
    onResetFilters() {
      _state.filterValues = {};
      _state.advancedFilters = [];
      _state.globalConnector = 'AND';
      _state.filtersOpen = false;
      _state.page = 1;
      void refreshRows({ clampPage: true });
    },
    setFiltersOpen(open: boolean) {
      _state.filtersOpen = open;
    },

    columnOrderStorageKey: skColumnOrder,
  };
}

export type RemoteEntityListState<TRow extends Record<string, unknown>> = ReturnType<
  typeof useRemoteEntityList<TRow>
>;
