<script lang="ts">
  /**
   * CustomerCreatePage — /crm/customers/create, module-owned (crm) remote page.
   *
   * Stub surface pending the form archetype (metadata-driven-page-system):
   * breadcrumb + title + "coming soon" — the create API is live and covered
   * by e2e through `/ws/crm/api/v1/entities/customer`.
   *
   * Rendering boundaries (cross-bundle rules — snippets NEVER cross):
   *   - AppPageBreadcrumb is a HOST component mounted via ctx.mount_host as
   *     a separate root; moduleBreadcrumbSegments is a host-state-bound
   *     function passed through ctx.components.
   *   - The new-title label is module-owned i18n (`crm.entities.customer.*`
   *     via bindRemoteCtx → crm.translations).
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
    const segments = [
      ...(c.moduleBreadcrumbSegments({ pathname: ctx.nav.route, t: (key) => $t(key) }) as unknown[]),
      { label: $t('crm.entities.customer.new.title') },
    ];
    const h = ctx.mount_host(c.AppPageBreadcrumb, el, { segments });
    return () => void h.destroy();
  });
</script>

<div class="min-w-0 space-y-1">
  <div bind:this={breadcrumbEl}></div>
  <h1 class="text-xl font-semibold leading-tight">{$t('crm.entities.customer.new.title')}</h1>
  <p class="text-sm text-muted-foreground">{$t('app.common.soon')}</p>
</div>
