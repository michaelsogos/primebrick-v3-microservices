<script lang="ts">
  /**
   * SchedulePage — /system/job/job-schedules/create, module-owned
   * (job-handler) remote page.
   *
   * The job module's ONLY custom surface: manual schedule creation. The
   * form composes `schedule_subject` + `target` (lane/service/action) —
   * a workflow, not a plain entity form, so it can't ride the standard
   * EntityTablePage archetype. All list pages (/system/job/job-schedules,
   * /system/job/runs, /system/job/rules) are host-rendered standard lists
   * declared kind:"list".
   *
   * Rendering boundaries (cross-bundle rules — snippets NEVER cross):
   *   - Page chrome (breadcrumb/star/title/description) is HOST-owned —
   *     rendered by the shell PageHeader from the route decl; this chunk
   *     mounts BODY content only.
   *   - Button is a HOST component mounted via ctx.mount_host as a separate
   *     root (HostLeaf for leaf granularity).
   *   - The form itself is remote-owned (this chunk's own Svelte + DOM).
   */
  import { extJsonStringify, notifyParentAndClose, type ModulePageHost } from '@primebrick/ui';
  import HostLeaf from './HostLeaf.svelte';
  import type { JobsComponents } from './host-contract';

  let { ctx }: { ctx: ModulePageHost } = $props();
  const comps = $derived(ctx.components as JobsComponents | undefined);
  const t = (key: string, params?: Record<string, unknown>) => ctx.i18n.t(key, params);

  let name = $state('');
  let spec = $state('@every 1h');
  let lane = $state<'system' | 'user'>('system');
  let targetService = $state('');
  let targetAction = $state('');
  let busy = $state(false);

  async function submit() {
    busy = true;
    try {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      const target = `jobs.due.${lane}.${targetService.trim()}.${targetAction.trim()}`;
      const res = await ctx.api('/api/v1/actions/schedule-job', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: extJsonStringify({
          schedule_subject: `jobs.schedule.job.${slug}`,
          schedule: spec.trim(),
          target,
        }),
      });
      if (!res.ok) throw new Error(`SCHEDULE_FAILED:${res.status}`);
      ctx.notify({ impact: 'LOW', message: t('job.jobs.scheduledOk'), scope: 'jobs.schedule' });
      // Child-tab contract: opened by EntityTablePage navStrategy="popup" —
      // broadcast + self-close; same-tab keeps the classic navigation.
      if (!notifyParentAndClose('primebrick_job_schedule_sync')) {
        window.location.assign('/system/job/job-schedules');
      }
    } catch (e) {
      ctx.notify({
        impact: 'MEDIUM',
        message: e instanceof Error ? e.message : 'SCHEDULE_FAILED',
        scope: 'jobs.schedule',
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
    <div class="flex min-h-0 flex-col overflow-y-auto">
      <form
        class="grid w-full max-w-lg gap-4"
        onsubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div class="grid gap-1.5">
          <label class="text-sm font-medium leading-none" for="sched-name">
            {t('job.jobs.scheduleDialog.name')}
          </label>
          <input
            id="sched-name"
            class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            bind:value={name}
            placeholder="nightly-cleanup"
            required
          />
        </div>
        <div class="grid gap-1.5">
          <label class="text-sm font-medium leading-none" for="sched-spec">
            {t('job.jobs.scheduleDialog.spec')}
          </label>
          <input
            id="sched-spec"
            class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            bind:value={spec}
            placeholder="@every 1h / @daily / cron"
            required
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
              bind:value={lane}
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
              bind:value={targetService}
              placeholder="ai"
              required
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
            bind:value={targetAction}
            placeholder="partition-maintenance"
            required
          />
        </div>
        <p class="text-muted-foreground text-xs">
          {t('job.jobs.scheduleDialog.preview', {
            values: {
              subject: `jobs.schedule.job.${name.trim() || '<name>'}`,
              target: `jobs.due.${lane}.${targetService.trim() || '<svc>'}.${targetAction.trim() || '<action>'}`,
            },
          })}
        </p>
        {#if comps}
          <div class="flex justify-end gap-2">
            <a
              href="/system/job/job-schedules"
              class="border-input bg-background inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
            >
              {t('app.common.cancel')}
            </a>
            <HostLeaf
              {ctx}
              comp={comps.Button}
              props={{
                label: t('job.jobs.scheduleDialog.arm'),
                disabled:
                  busy ||
                  !name.trim() ||
                  !spec.trim() ||
                  !targetService.trim() ||
                  !targetAction.trim(),
                onclick: () => void submit(),
              }}
            />
          </div>
        {/if}
      </form>
    </div>
  </div>
</div>
