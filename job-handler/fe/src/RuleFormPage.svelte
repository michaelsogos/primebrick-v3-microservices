<script lang="ts">
  /**
   * RuleFormPage — /system/job/rules/new, module-owned (job-handler) remote page.
   *
   * Rule creation composes `event_subject` → optional payload filter →
   * `schedule_spec` + `target_subject` (what the rules-engine arms when the
   * event matches) — a workflow surface, not a plain entity form, so like
   * /system/job/new it rides the remote chunk instead of the host archetype.
   *
   * Submission is the canonical entity create route:
   *   POST /api/v1/entities/job_rule  { entity: {…} }
   * resolved service-relative by ctx.api → /ws/job/api/v1/entities/job_rule.
   *
   * Rendering boundaries: identical to SchedulePage — breadcrumb and the
   * submit Button are host components mounted via ctx.mount_host (separate
   * roots; snippets never cross the bundle boundary).
   */
  import { extJsonStringify, type ModulePageHost } from '@primebrick/ui';
  import HostLeaf from './HostLeaf.svelte';
  import type { JobsComponents } from './host-contract';

  let { ctx }: { ctx: ModulePageHost } = $props();
  const comps = $derived(ctx.components as JobsComponents | undefined);
  const t = (key: string, params?: Record<string, unknown>) => ctx.i18n.t(key, params);

  // Breadcrumb — host-mounted once (module menu segment resolved host-side).
  let breadcrumbEl = $state<HTMLDivElement>();
  $effect(() => {
    const el = breadcrumbEl;
    const c = comps;
    if (!el || !c || !ctx.mount_host) return;
    const segments = [c.moduleMenuSegment({ pathname: ctx.nav.route, t })];
    const h = ctx.mount_host(c.AppPageBreadcrumb, el, { segments });
    return () => void h.destroy();
  });

  // Field labels reuse the canonical entity-label keys (job.entities.job_rule.fields.*).
  const FL = (f: string) => `job.entities.job_rule.fields.${f}`;

  let name = $state('');
  let eventSubject = $state('');
  let scheduleSpec = $state('@every 5m');
  let targetSubject = $state('');
  let executionContext = $state<'system' | 'user'>('user');
  let enabled = $state(true);
  let busy = $state(false);

  async function submit() {
    busy = true;
    try {
      const res = await ctx.api('/api/v1/entities/job_rule', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: extJsonStringify({
          entity: {
            name: name.trim(),
            event_subject: eventSubject.trim(),
            schedule_spec: scheduleSpec.trim(),
            target_subject: targetSubject.trim(),
            execution_context: executionContext,
            enabled,
          },
        }),
      });
      if (!res.ok) throw new Error(`RULE_CREATE_FAILED:${res.status}`);
      ctx.notify({ impact: 'LOW', message: t('job.jobs.ruleForm.created'), scope: 'jobs.rules' });
      window.location.assign('/system/job/rules');
    } catch (e) {
      ctx.notify({
        impact: 'MEDIUM',
        message: e instanceof Error ? e.message : 'RULE_CREATE_FAILED',
        scope: 'jobs.rules',
      });
    } finally {
      busy = false;
    }
  }
</script>

<!-- Remote-owned scaffold — same shell classes as the host AppPageScaffold
     (the host document's stylesheets apply to remote DOM). -->
<div class="h-full p-2 sm:p-3 contain-layout">
  <div class="flex h-full w-full flex-col gap-4 min-h-0 overflow-hidden">
    <header class="shrink-0">
      <div class="min-w-0 flex-1 space-y-1">
        <div bind:this={breadcrumbEl}></div>
        <h1 class="truncate text-xl font-semibold leading-tight">
          {t('job.jobs.ruleForm.title')}
        </h1>
        <p class="text-sm text-muted-foreground">{t('job.jobs.ruleForm.desc')}</p>
      </div>
    </header>

    <div class="flex min-h-0 flex-col overflow-y-auto">
      <form
        class="grid w-full max-w-lg gap-4"
        onsubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div class="grid gap-1.5">
          <label class="text-sm font-medium leading-none" for="rule-name">
            {t(FL('name'))}
          </label>
          <input
            id="rule-name"
            class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            bind:value={name}
            placeholder="nightly-cleanup"
            required
          />
        </div>
        <div class="grid gap-1.5">
          <label class="text-sm font-medium leading-none" for="rule-event">
            {t(FL('event_subject'))}
          </label>
          <input
            id="rule-event"
            class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            bind:value={eventSubject}
            placeholder="jobs.due.user.ai.*"
            required
          />
        </div>
        <div class="grid gap-1.5">
          <label class="text-sm font-medium leading-none" for="rule-spec">
            {t(FL('schedule_spec'))}
          </label>
          <input
            id="rule-spec"
            class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            bind:value={scheduleSpec}
            placeholder="@every 5m / @daily / cron"
            required
          />
        </div>
        <div class="grid gap-1.5">
          <label class="text-sm font-medium leading-none" for="rule-target">
            {t(FL('target_subject'))}
          </label>
          <input
            id="rule-target"
            class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            bind:value={targetSubject}
            placeholder="jobs.due.user.ai.partition-maintenance"
            required
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="grid gap-1.5">
            <label class="text-sm font-medium leading-none" for="rule-lane">
              {t(FL('execution_context'))}
            </label>
            <select
              id="rule-lane"
              class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              bind:value={executionContext}
            >
              <option value="user">{t('job.entities.job_rule.status.user')}</option>
              <option value="system">{t('job.entities.job_rule.status.system')}</option>
            </select>
          </div>
          <div class="grid gap-1.5">
            <label class="text-sm font-medium leading-none" for="rule-enabled">
              {t(FL('enabled'))}
            </label>
            <div class="flex h-9 items-center">
              <input id="rule-enabled" type="checkbox" bind:checked={enabled} class="size-4" />
            </div>
          </div>
        </div>
        {#if comps}
          <div class="flex justify-end gap-2">
            <a
              href="/system/job/rules"
              class="border-input bg-background inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
            >
              {t('app.common.cancel')}
            </a>
            <HostLeaf
              {ctx}
              comp={comps.Button}
              props={{
                label: t('job.jobs.ruleForm.create'),
                disabled:
                  busy ||
                  !name.trim() ||
                  !eventSubject.trim() ||
                  !scheduleSpec.trim() ||
                  !targetSubject.trim(),
                onclick: () => void submit(),
              }}
            />
          </div>
        {/if}
      </form>
    </div>
  </div>
</div>
