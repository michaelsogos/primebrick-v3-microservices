<script lang="ts">
  /**
   * JobsPage — /system/jobs, module-owned (job-handler).
   *
   * Job governance admin page — four entity-list views over the job service
   * (via ctx.api → /ws/job proxy):
   *   1. JOBS RECURRING     — job_schedule rows where schedule_type=recurring
   *   2. JOBS EXECUTED ONCE — job_schedule rows where schedule_type=once
   *   3. JOB RULES          — job_rule rows
   *   4. RUN HISTORY        — job_run execution records
   *
   * Rendering boundaries (cross-bundle rules — snippets NEVER cross):
   *   - EntityListTable / AppPageBreadcrumb / Button are HOST components
   *     mounted via ctx.mount_host (separate Svelte roots inside remote
   *     DOM; Button goes through the <HostLeaf> helper at leaf granularity).
   *   - `cell` forwarded to the tables is the HOST-owned `jobs_cell`
   *     snippet from the shim — invoked inside host render, it routes
   *     module-owned cell types to a remote root via
   *     components.remote.cell_mount (RemoteMountSlot).
   *   - Everything else (layout, sections, schedule dialog, sparkline,
   *     list state machines) is remote-owned — this chunk's own Svelte.
   */
  import { onMount, untrack } from 'svelte';
  import {
    extJsonStringify,
    isSnakeCaseSingular,
    type HostMountHandle,
    type ModulePageHost,
  } from '@primebrick/ui';
  import { useRemoteEntityList, type RemoteEntityListState } from './remote-list.svelte';
  import { loadRunStats } from './run-stats.svelte';
  import HostLeaf from './HostLeaf.svelte';
  import type { EntityListTableHostProps, JobsComponents } from './host-contract';

  type JobRow = { uuid: string; schedule_subject?: string } & Record<string, unknown>;

  let { ctx }: { ctx: ModulePageHost } = $props();
  const comps = $derived(ctx.components as JobsComponents | undefined);
  const t = (key: string, params?: Record<string, unknown>) => ctx.i18n.t(key, params);

  // ── four list scopes ─────────────────────────────────────────────────
  // untrack: ctx is immutable by host contract — the prop reference is
  // intentionally captured once at init, not tracked.
  const recurring = untrack(() =>
    useRemoteEntityList<JobRow>({
      ctx,
      basePath: '/api/v1/entities/job_schedule',
      storageKeyPrefix: 'pb:jobs:recurring:',
      fixedFilters: [{ field: 'schedule_type', op: '=', value: 'recurring' }],
      onRowsLoaded: (rows) => void loadRunStats(ctx, rows),
      errorScopeKey: 'jobs',
    }),
  );

  const once = untrack(() =>
    useRemoteEntityList<JobRow>({
      ctx,
      basePath: '/api/v1/entities/job_schedule',
      storageKeyPrefix: 'pb:jobs:once:',
      fixedFilters: [{ field: 'schedule_type', op: '=', value: 'once' }],
      onRowsLoaded: (rows) => void loadRunStats(ctx, rows),
      errorScopeKey: 'jobs',
    }),
  );

  const rules = untrack(() =>
    useRemoteEntityList<JobRow>({
      ctx,
      basePath: '/api/v1/entities/job_rule',
      storageKeyPrefix: 'pb:jobs:rules:',
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
  let recurringEl = $state<HTMLDivElement>();
  let onceEl = $state<HTMLDivElement>();
  let rulesEl = $state<HTMLDivElement>();
  let runsEl = $state<HTMLDivElement>();

  function tableProps(list: RemoteEntityListState<JobRow>): EntityListTableHostProps<JobRow> {
    const meta = list.meta;
    const tk =
      meta?.translation_key && isSnakeCaseSingular(meta.translation_key)
        ? meta.translation_key
        : meta?.entity;
    return {
      entity: meta?.entity,
      translationKey: tk,
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
      selectionLabelSingularKey: `system.entities.${tk}.singular`,
      selectionLabelKey: `system.entities.${tk}.plural`,
      // HOST-owned snippet (shim) — invoked inside host render: safe. It
      // routes module-owned cell types back to us via remote.cell_mount.
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

  mountTable(() => recurringEl, recurring);
  mountTable(() => onceEl, once);
  mountTable(() => rulesEl, rules);
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
      ctx.notify({ impact: 'LOW', message: t('system.jobs.scheduledOk'), scope: 'jobs.schedule' });
      void recurring.refreshRows();
      void once.refreshRows();
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
    await Promise.allSettled([recurring.init(), once.init(), runs.init(), rules.init()]);
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
          <h1 class="truncate text-xl font-semibold leading-tight">{t('system.jobs.title')}</h1>
          {#if comps}
            <HostLeaf
              {ctx}
              comp={comps.Button}
              props={{
                label: t('system.jobs.scheduleNew'),
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
          {t('system.jobs.sections.recurring')}
        </h2>
        <div bind:this={recurringEl}></div>
      </section>

      <section class="space-y-2">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('system.jobs.sections.once')}
        </h2>
        <div bind:this={onceEl}></div>
      </section>

      <section class="space-y-2">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('system.jobs.sections.rules')}
        </h2>
        <div bind:this={rulesEl}></div>
      </section>

      <section class="space-y-2">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('system.jobs.sections.runs')}
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
          {t('system.jobs.scheduleDialog.title')}
        </h2>
        <p class="mt-1.5 text-sm text-muted-foreground">
          {t('system.jobs.scheduleDialog.desc')}
        </p>
      </div>
      <div class="grid gap-4 py-2">
        <div class="grid gap-1.5">
          <label class="text-sm font-medium leading-none" for="sched-name">
            {t('system.jobs.scheduleDialog.name')}
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
            {t('system.jobs.scheduleDialog.spec')}
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
              {t('system.jobs.scheduleDialog.lane')}
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
              {t('system.jobs.scheduleDialog.targetService')}
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
            {t('system.jobs.scheduleDialog.targetAction')}
          </label>
          <input
            id="sched-tgt-act"
            class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            bind:value={schedTargetAction}
            placeholder="partition-maintenance"
          />
        </div>
        <p class="text-muted-foreground text-xs">
          {t('system.jobs.scheduleDialog.preview', {
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
              label: t('system.jobs.scheduleDialog.arm'),
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

<!-- Custom cells are not remote snippets — the host shim's `jobs_cell`
     routes `run_stats_sparkline`/`duration_ms` columns to RemoteMountSlot,
     which calls this chunk's `cell_mount` export (see index.ts). The
     remote cell root renders RemoteCellShell — sparkline reads the shared
     run-stats module state. -->
