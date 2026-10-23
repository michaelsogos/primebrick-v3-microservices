<script lang="ts">
  /**
   * RunDetailSheet — `job.runDetail` remote sheet content, module-owned
   * (job-handler). Mounted by the host's RemoteSheetMount via `mountSheet`:
   * the host owns the sheet engine/chrome; this chunk owns the panel —
   * its fields, its fetch, its labels (`job.entities.job_run.*` keys).
   *
   * Props contract: `ctx.sheet.props.run_uuid` — the job_run uuid to show.
   * The fetch rides `ctx.api` (ws-bound → /ws/job/api/v1/entities/job_run).
   */
  import type { ModuleSheetHost } from '@primebrick/ui';

  let { ctx }: { ctx: ModuleSheetHost } = $props();
  const t = (key: string, params?: Record<string, unknown>) => ctx.i18n.t(key, params);

  type JobRun = {
    uuid: string;
    schedule_subject: string;
    service_code: string;
    job_name: string;
    lane: string;
    status: string;
    error_code?: string | null;
    error_detail?: string | null;
    duration_ms?: number | string | null;
    redelivery_count?: number | null;
    initiator?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };

  const run_uuid = $derived(ctx.sheet.props['run_uuid'] as string | undefined);

  type Phase = 'loading' | 'ready' | 'error';
  let phase = $state<Phase>('loading');
  let run = $state<JobRun | null>(null);

  async function load() {
    if (!run_uuid) {
      phase = 'error';
      return;
    }
    phase = 'loading';
    try {
      const res = await ctx.api(`/api/v1/entities/job_run/${encodeURIComponent(run_uuid)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      run = (await res.json()) as JobRun;
      phase = 'ready';
    } catch (e) {
      phase = 'error';
      ctx.notify({
        impact: 'MEDIUM',
        message: e instanceof Error ? e.message : String(e),
        scope: 'job.runDetail',
        toast: true,
      });
    }
  }

  $effect(() => {
    void run_uuid;
    void load();
  });

  const F = (c: string) => `job.entities.job_run.fields.${c}`;
  const S = (v: string) => `job.entities.job_run.status.${v}`;

  const statusColor = (status: string | undefined) =>
    status === 'succeeded'
      ? 'text-emerald-600'
      : status === 'failed'
        ? 'text-red-600'
        : status === 'skipped'
          ? 'text-amber-600'
          : 'text-muted-foreground';
</script>

<div class="flex h-full flex-col">
  <header class="flex items-center justify-between border-b px-4 py-3">
    <h2 class="text-base font-semibold">{t('job.entities.job_run.title')}</h2>
    <button
      type="button"
      class="text-muted-foreground hover:text-foreground text-sm"
      onclick={() => ctx.sheet.close()}
    >
      ✕
    </button>
  </header>

  {#if phase === 'loading'}
    <div class="flex flex-1 items-center justify-center p-6">
      <span class="text-muted-foreground text-sm">{t('app.loading')}</span>
    </div>
  {:else if phase === 'error' || !run}
    <div class="flex flex-1 items-center justify-center p-6">
      <span class="text-destructive text-sm">{t('app.errors.load_failed')}</span>
    </div>
  {:else}
    <div class="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      <div class="flex items-center gap-2">
        <span class={`text-lg font-semibold ${statusColor(run.status)}`}>
          {t(S(run.status))}
        </span>
        <span class="text-muted-foreground font-mono text-xs">{run.uuid}</span>
      </div>
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt class="text-muted-foreground">{t(F('job_name'))}</dt>
        <dd class="font-medium">{run.job_name}</dd>
        <dt class="text-muted-foreground">{t(F('service_code'))}</dt>
        <dd class="font-medium">{run.service_code}</dd>
        <dt class="text-muted-foreground">{t(F('schedule_subject'))}</dt>
        <dd class="font-mono text-xs">{run.schedule_subject}</dd>
        <dt class="text-muted-foreground">{t(F('lane'))}</dt>
        <dd>{run.lane}</dd>
        {#if run.initiator}
          <dt class="text-muted-foreground">{t(F('initiator'))}</dt>
          <dd>{run.initiator}</dd>
        {/if}
        <dt class="text-muted-foreground">{t(F('started_at'))}</dt>
        <dd>{run.created_at ?? '—'}</dd>
        <dt class="text-muted-foreground">{t(F('finished_at'))}</dt>
        <dd>{run.updated_at ?? '—'}</dd>
        {#if run.duration_ms != null}
          <dt class="text-muted-foreground">{t(F('duration'))}</dt>
          <dd>{run.duration_ms} ms</dd>
        {/if}
        {#if run.redelivery_count != null}
          <dt class="text-muted-foreground">{t(F('redelivery'))}</dt>
          <dd>{run.redelivery_count}</dd>
        {/if}
      </dl>
      {#if run.status === 'failed' && (run.error_code || run.error_detail)}
        <div class="border-destructive/50 rounded-md border p-3">
          <div class="text-destructive text-sm font-medium">
            {t(F('error_code'))}: {run.error_code}
          </div>
          {#if run.error_detail}
            <pre class="text-muted-foreground mt-1 text-xs whitespace-pre-wrap">{run.error_detail}</pre>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
