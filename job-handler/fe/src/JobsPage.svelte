<script lang="ts">
  /**
   * JobsPage — /system/jobs, module-owned (job-handler).
   *
   * Job governance admin page — two entity-list views over the job service
   * (via ctx.api → /ws/job proxy):
   *   1. JOB SCHEDULES — job_schedule rows, scope via the meta-declared
   *      `schedule_kind` toolbar preset (recurring / once / all)
   *   2. RUN HISTORY   — job_run execution records
   *
   * (Job rules moved to the host-rendered `/system/jobs/rules` list page.)
   *
   * Rendering boundaries (cross-bundle rules — snippets NEVER cross):
   *   - EntityListTable / AppPageBreadcrumb / Button are HOST components
   *     mounted via ctx.mount_host (separate Svelte roots inside remote
   *     DOM; Button goes through the <HostLeaf> helper at leaf granularity).
   *   - `cell` forwarded to the tables is the HOST-owned `jobs_cell`
   *     snippet from the shim — invoked inside host render; it only keeps
   *     the `duration_ms` humanizer now that `type:"sparkline"` is a
   *     builtin (fed by the engine's meta-declared batch fetch).
   *   - Everything else (layout, sections, schedule dialog, list state
   *     machines) is remote-owned — this chunk's own Svelte.
   */
  import { onMount, untrack } from 'svelte';
  import {
    extJsonStringify,
    isSnakeCaseSingular,
    type HostMountHandle,
    type ModulePageHost,
  } from '@primebrick/ui';
  import { useRemoteEntityList, type RemoteEntityListState } from './remote-list.svelte';
  import HostLeaf from './HostLeaf.svelte';
  import type { EntityListTableHostProps, JobsComponents } from './host-contract';

  type JobRow = { uuid: string; schedule_subject?: string } & Record<string, unknown>;

  let { ctx }: { ctx: ModulePageHost } = $props();
  const comps = $derived(ctx.components as JobsComponents | undefined);
  const t = (key: string, params?: Record<string, unknown>) => ctx.i18n.t(key, params);

  // ── two list scopes ──────────────────────────────────────────────────
  // untrack: ctx is immutable by host contract — the prop reference is
  // intentionally captured once at init, not tracked.
  const schedules = untrack(() =>
    useRemoteEntityList<JobRow>({
      ctx,
      basePath: '/api/v1/entities/job_schedule',
      storageKeyPrefix: 'pb:jobs:schedules:',
      errorScopeKey: 'jobs',
    }),
  );

  const runs = untrack(() =>
    useRemoteEntityList<JobRow>({
      ctx,
      basePath: '/api/v1/entities/job_run',
      storageKeyPrefix: 'pb:jobs:runs:',
      errorScopeKey: 'jobs',
    }),
  );

  // ── host component mounting (mount_host bridge) ──────────────────────
  let breadcrumbEl = $state<HTMLDivElement>();
  let schedulesEl = $state<HTMLDivElement>();
  let runsEl = $state<HTMLDivElement>();

  function tableProps(list: RemoteEntityListState<JobRow>): EntityListTableHostProps<JobRow> {
    const meta = list.meta;
    const tk =
      meta?.translation_key && isSnakeCaseSingular(meta.translation_key)
        ? meta.translation_key
        : meta?.entity;
    // Entity-label namespace comes from the served meta — `job.entities.*`
    // keys live in the `job` module's own translations schema, never
    // `system.entities.*` (that namespace belongs to BE-owned entities).
    const entitiesNs = meta?.entities_ns ?? 'system';
    return {
      entity: meta?.entity,
      translationKey: tk,
      entities_ns: entitiesNs,
      uid: meta?.uid ?? 'uuid',
      columnOrderStorageKey: list.columnOrderStorageKey,
      columns: list.columns,
      entityActions: meta?.actions,
      rows: list.rows,
      total: list.total,
      metaLoading: list.metaLoading,
      rowsLoading: list.rowsLoading,
      error: list.error,
      page: list.page,
      pageSize: list.pageSize,
      onPageChange: list.onPageChange,
      onPageSizeChange: list.onPageSizeChange,
      search: list.search,
      onSearchInput: list.onSearchInput,
      searchInKeys: list.searchInKeys,
      onSearchInKeysChange: list.onSearchInKeysChange,
      sortKey: list.sortKey,
      sortDir: list.sortDir,
      onSortChange: list.onSortChange,
      visibleKeys: list.visibleKeys,
      onVisibleKeysChange: list.onVisibleKeysChange,
      onResetColumnVisibility: list.onResetColumnVisibility,
      selectedKeys: list.selectedKeys,
      onSelectedKeysChange: list.onSelectedKeysChange,
      defaultView: list.viewMode,
      defaultSort: meta?.table?.default_sort,
      pageSizeOptions: meta?.table?.page_size_options,
      filtersOpen: list.filtersOpen,
      filterValues: list.filterValues,
      advancedFilters: list.advancedFilters,
      onFilterValuesChange: list.onFilterValuesChange,
      onAdvancedFiltersChange: list.onAdvancedFiltersChange,
      onResetFilters: list.onResetFilters,
      onRefresh: () => void list.refreshRows(),
      selectionLabelSingularKey: `${entitiesNs}.entities.${tk}.singular`,
      selectionLabelKey: `${entitiesNs}.entities.${tk}.plural`,
      // Meta-declared toolbar presets (schedule_type scope) + builtin
      // sparkline buckets — resolved/fetched by the list engine.
      filterPresets: list.filterPresets,
      presetSelections: list.presetSelections,
      onPresetChange: list.onPresetChange,
      sparklineData: list.sparklineData,
      // HOST-owned snippet (shim) — invoked inside host render: safe.
      // Only the `duration_ms` humanizer remains a custom cell.
      cell: comps?.jobs_cell,
    };
  }

  function mountTable(getEl: () => HTMLDivElement | undefined, list: RemoteEntityListState<JobRow>) {
    let handle: HostMountHandle | null = null;
    $effect(() => {
      const el = getEl();
      const c = comps;
      if (!el || !c || !ctx.mount_host) return;
      // untrack: the initial props snapshot must not subscribe this mount
      // effect to list state — updates flow through the companion effect.
      handle = ctx.mount_host(c.EntityListTable, el, untrack(() => tableProps(list)));
      return () => {
        void handle?.destroy();
        handle = null;
      };
    });
    $effect(() => {
      if (!comps || !getEl()) return;
      handle?.update(tableProps(list));
    });
  }

  mountTable(() => schedulesEl, schedules);
  mountTable(() => runsEl, runs);

  // Breadcrumb — mounted once into the header slot.
  $effect(() => {
    const el = breadcrumbEl;
    const c = comps;
    if (!el || !c || !ctx.mount_host) return;
    const segments = [
      { label: t('app.system') },
      { label: t('system.settings.title'), href: '/system/settings/profile' },
      c.settingsTabMenuSegment({
        pathname: ctx.nav.route,
        searchParams: new URLSearchParams(),
        t,
      }),
    ];
    const h = ctx.mount_host(c.AppPageBreadcrumb, el, { segments });
    return () => void h.destroy();
  });

  // ── manual schedule dialog (remote-owned) ────────────────────────────
  let scheduleDialogOpen = $state(false);
  let schedName = $state('');
  let schedSpec = $state('@every 1h');
  let schedLane = $state<'system' | 'user'>('system');
  let schedTargetService = $state('');
  let schedTargetAction = $state('');
  let schedBusy = $state(false);

  async function submitSchedule() {
    schedBusy = true;
    try {
      const name = schedName.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      const target = `jobs.due.${schedLane}.${schedTargetService.trim()}.${schedTargetAction.trim()}`;
      const res = await ctx.api('/api/v1/actions/schedule-job', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: extJsonStringify({
          schedule_subject: `jobs.schedule.job.${name}`,
          schedule: schedSpec.trim(),
          target,
        }),
      });
      if (!res.ok) throw new Error(`SCHEDULE_FAILED:${res.status}`);
      scheduleDialogOpen = false;
      ctx.notify({ impact: 'LOW', message: t('job.jobs.scheduledOk'), scope: 'jobs.schedule' });
      void schedules.refreshRows();
    } catch (e) {
      ctx.notify({
        impact: 'MEDIUM',
        message: e instanceof Error ? e.message : 'SCHEDULE_FAILED',
        scope: 'jobs.schedule',
      });
    } finally {
      schedBusy = false;
    }
  }

  async function init() {
    await Promise.allSettled([schedules.init(), runs.init()]);
  }

  onMount(() => {
    void init();
    const c = comps;
    if (!c) return;
    return c.onConnectivityRestored(() => void init());
  });
</script>

<!-- Remote-owned scaffold — same shell classes as the host AppPageScaffold
     (the host document's stylesheets apply to remote DOM). -->
<div class="h-full p-2 sm:p-3 contain-layout">
  <div class="flex h-full w-full flex-col gap-4 min-h-0 overflow-hidden">
    <header class="shrink-0">
      <div class="min-w-0 flex-1 space-y-1">
        <div bind:this={breadcrumbEl}></div>
        <div class="flex items-center justify-between gap-2">
          <h1 class="truncate text-xl font-semibold leading-tight">{t('job.jobs.title')}</h1>
          {#if comps}
            <HostLeaf
              {ctx}
              comp={comps.Button}
              props={{
                label: t('job.jobs.scheduleNew'),
                onclick: () => (scheduleDialogOpen = true),
              }}
            />
          {/if}
        </div>
      </div>
    </header>

    <div class="flex min-h-0 flex-col gap-8 overflow-y-auto">
      <section class="space-y-2">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('job.jobs.sections.schedules')}
        </h2>
        <div bind:this={schedulesEl}></div>
      </section>

      <section class="space-y-2">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('job.jobs.sections.runs')}
        </h2>
        <div bind:this={runsEl}></div>
      </section>
    </div>
  </div>
</div>

<!-- Schedule dialog — remote-owned chrome (overlay + panel); CTA buttons
     rendered via the host_button snippet for visual identity. -->
{#if scheduleDialogOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button
      type="button"
      class="absolute inset-0 bg-black/50"
      aria-label={t('app.common.cancel')}
      onclick={() => (scheduleDialogOpen = false)}
    ></button>
    <div
      class="relative z-10 grid w-full gap-4 rounded-lg border bg-background p-6 shadow-lg sm:max-w-lg"
      role="dialog"
      aria-modal="true"
    >
      <div>
        <h2 class="text-lg font-semibold leading-none tracking-tight">
          {t('job.jobs.scheduleDialog.title')}
        </h2>
        <p class="mt-1.5 text-sm text-muted-foreground">
          {t('job.jobs.scheduleDialog.desc')}
        </p>
      </div>
      <div class="grid gap-4 py-2">
        <div class="grid gap-1.5">
          <label class="text-sm font-medium leading-none" for="sched-name">
            {t('job.jobs.scheduleDialog.name')}
          </label>
          <input
            id="sched-name"
            class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            bind:value={schedName}
            placeholder="nightly-cleanup"
          />
        </div>
        <div class="grid gap-1.5">
          <label class="text-sm font-medium leading-none" for="sched-spec">
            {t('job.jobs.scheduleDialog.spec')}
          </label>
          <input
            id="sched-spec"
            class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            bind:value={schedSpec}
            placeholder="@every 1h / @daily / cron"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="grid gap-1.5">
            <label class="text-sm font-medium leading-none" for="sched-lane">
              {t('job.jobs.scheduleDialog.lane')}
            </label>
            <select
              id="sched-lane"
              class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              bind:value={schedLane}
            >
              <option value="system">system</option>
              <option value="user">user</option>
            </select>
          </div>
          <div class="grid gap-1.5">
            <label class="text-sm font-medium leading-none" for="sched-tgt-svc">
              {t('job.jobs.scheduleDialog.targetService')}
            </label>
            <input
              id="sched-tgt-svc"
              class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              bind:value={schedTargetService}
              placeholder="ai"
            />
          </div>
        </div>
        <div class="grid gap-1.5">
          <label class="text-sm font-medium leading-none" for="sched-tgt-act">
            {t('job.jobs.scheduleDialog.targetAction')}
          </label>
          <input
            id="sched-tgt-act"
            class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            bind:value={schedTargetAction}
            placeholder="partition-maintenance"
          />
        </div>
        <p class="text-muted-foreground text-xs">
          {t('job.jobs.scheduleDialog.preview', {
            values: {
              subject: `jobs.schedule.job.${schedName.trim() || '<name>'}`,
              target: `jobs.due.${schedLane}.${schedTargetService.trim() || '<svc>'}.${schedTargetAction.trim() || '<action>'}`,
            },
          })}
        </p>
      </div>
      {#if comps}
        <div class="flex justify-end gap-2">
          <HostLeaf
            {ctx}
            comp={comps.Button}
            props={{
              label: t('app.common.cancel'),
              variant: 'ghost',
              onclick: () => (scheduleDialogOpen = false),
            }}
          />
          <HostLeaf
            {ctx}
            comp={comps.Button}
            props={{
              label: t('job.jobs.scheduleDialog.arm'),
              disabled:
                schedBusy ||
                !schedName.trim() ||
                !schedSpec.trim() ||
                !schedTargetService.trim() ||
                !schedTargetAction.trim(),
              onclick: () => void submitSchedule(),
            }}
          />
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- The host shim's `jobs_cell` keeps only the `duration_ms` humanizer —
     `type:"sparkline"` is a builtin cell fed by `sparklineData` (the list
     engine batch-fetches `column.sparkline.endpoint` after every load). -->
