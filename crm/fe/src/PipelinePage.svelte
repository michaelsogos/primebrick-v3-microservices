<script lang="ts">
  /**
   * PipelinePage — /system/crm/pipeline, module-owned (crm) remote page.
   *
   * Static preview surface (mock pipeline placeholders, no data writes).
   * Labels are module-owned i18n (`crm.pipeline.*` in crm.translations via
   * bindRemoteCtx); the breadcrumb is host-mounted via ctx.mount_host.
   */
  import { getT, type ModulePageHost } from '@primebrick/ui';
  import type { CrmPageComponents } from './host-contract';

  let { ctx }: { ctx: ModulePageHost } = $props();
  const comps = $derived(ctx.components as CrmPageComponents | undefined);
  const t = getT();

  let breadcrumbEl = $state<HTMLDivElement>();
  $effect(() => {
    const el = breadcrumbEl;
    const c = comps;
    if (!el || !c || !ctx.mount_host) return;
    const segments = c.moduleBreadcrumbSegments({ pathname: ctx.nav.route, t: (key) => $t(key) });
    const h = ctx.mount_host(c.AppPageBreadcrumb, el, { segments });
    return () => void h.destroy();
  });
</script>

<div class="min-w-0 space-y-1">
  <div bind:this={breadcrumbEl}></div>
  <h1 class="truncate text-xl font-semibold leading-tight">{$t('crm.pipeline.title')}</h1>
</div>

<div class="flex min-h-0 flex-1 flex-col overflow-auto">
  <div class="shrink-0 space-y-2">
    <h2 class="text-lg font-semibold">{$t('crm.pipeline.cardTitle')}</h2>
    <p class="text-sm text-muted-foreground">{$t('crm.pipeline.description')}</p>
  </div>
  <div class="min-h-0 flex-1 space-y-3 overflow-auto text-sm text-muted-foreground">
    <p>{$t('crm.pipeline.body1')}</p>
    <p>{$t('crm.pipeline.body2')}</p>
    <ul class="list-inside list-disc space-y-1 pl-1">
      <li>{$t('crm.pipeline.fake1')}</li>
      <li>{$t('crm.pipeline.fake2')}</li>
      <li>{$t('crm.pipeline.fake3')}</li>
    </ul>
  </div>
</div>
