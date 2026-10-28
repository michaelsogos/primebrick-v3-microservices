<script lang="ts">
  /**
   * PipelinePage — /system/crm/pipeline, module-owned (crm) remote page.
   *
   * Static preview surface (mock pipeline placeholders, no data writes).
   * Labels are module-owned i18n (`crm.pipeline.*` in crm.translations via
   * bindRemoteCtx); page chrome (breadcrumb/star/title) is HOST-owned —
   * rendered by the shell PageHeader from the route decl.
   */
  import { getT, type ModulePageHost } from '@primebrick/ui';

  let { ctx: _ctx }: { ctx: ModulePageHost } = $props();
  const t = getT();
  void _ctx;
</script>

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
