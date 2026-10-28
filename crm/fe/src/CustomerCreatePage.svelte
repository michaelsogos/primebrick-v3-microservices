<script lang="ts">
  /**
   * CustomerCreatePage — /crm/customers/create, module-owned (crm) remote page.
   *
   * Stub surface pending the form archetype (metadata-driven-page-system):
   * "coming soon" body only — page chrome (breadcrumb/star/title) is
   * HOST-owned, rendered by the shell PageHeader from the route decl.
   */
  import { getT, type ModulePageHost } from '@primebrick/ui';

  let { ctx: _ctx }: { ctx: ModulePageHost } = $props();
  const t = getT();
  void _ctx;
</script>

<div class="min-w-0 p-4">
  <p class="text-sm text-muted-foreground">{$t('app.common.soon')}</p>
</div>
