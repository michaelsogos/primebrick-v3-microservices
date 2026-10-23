<script lang="ts">
  /**
   * ModelCacheSheet — `ai.modelCache` remote sheet content (module-owned).
   *
   * Full model-cache detail view (censused + orphaned rows, storage
   * breakdown, bulk actions). Reuses ModelCacheSection — the same shared
   * component used on the AI settings page — so the popover stays minimal
   * while this sheet carries details.
   *
   * Props contract: `ctx.sheet.props` = `{ active_model_id?, model_ranks? }`.
   * Mounted by the host's RemoteSheetMount via `mountSheet`.
   */
  import type { ModuleSheetHost } from '@primebrick/ui';
  import { SheetPanelLayout } from '@primebrick/ui';
  import { ModelCacheSection } from '@primebrick/ui';
  import { HardDrive } from '@primebrick/ui/vendor/lucide';

  let { ctx }: { ctx: ModuleSheetHost } = $props();
  const t = (key: string, params?: Record<string, unknown>) => ctx.i18n.t(key, params);

  const active_model_id = $derived((ctx.sheet.props['active_model_id'] ?? null) as string | null);
  const model_ranks = $derived((ctx.sheet.props['model_ranks'] ?? {}) as Record<string, number | null>);
</script>

<SheetPanelLayout contentClass="p-4" onClose={ctx.sheet.close}>
  {#snippet icon()}
    <HardDrive class="size-4" />
  {/snippet}

  {#snippet title()}
    {t('app.smart.regex.ai.cache.title')}
  {/snippet}

  <div data-testid="ai-model-cache-sheet">
    <ModelCacheSection {active_model_id} {model_ranks} />
  </div>
</SheetPanelLayout>
