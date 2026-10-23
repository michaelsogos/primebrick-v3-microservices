<script lang="ts">
  /**
   * CerebellumSheet — `ai.cerebellum` remote sheet content (module-owned):
   * create/edit form for an `ai_cerebellum` tuning row.
   *
   * A cerebellum is a per-(assistant_key, model_id) preset of optional
   * generation-param overrides; NULL fields inherit the model defaults.
   * `name` is NOT user-editable: it is the assistant's i18n key
   * (`app.smart.<ns>.ai.cerebellum_name`) derived from `assistant_key`.
   *
   * If the (assistant_key, model_id) pair already exists in `rows`, the
   * sheet becomes an EDIT: fields are prepopulated and save() issues
   * PUT /:uuid with the mandatory optimistic-lock `version`.
   *
   * Props contract: `ctx.sheet.props` =
   *   `{ models, assistants, rows?, onCreated? }`.
   * Writes ride `ctx.api` (ws-bound → /ws/ai/api/v1/entities/ai_cerebellum).
   */
  import type { ModuleSheetHost } from '@primebrick/ui';
  import { modelVariantKey, type AiCerebellum, type AiModel } from '@primebrick/ui';
  import { ComboSelect } from '@primebrick/ui';
  import { AiModelOption } from '@primebrick/ui';
  import { CerebellumRecommendationBadge } from '@primebrick/ui';
  import { Button } from '@primebrick/ui';
  import { SliderField } from '@primebrick/ui';
  import { SwitchField } from '@primebrick/ui';
  import { SelectableFieldset } from '@primebrick/ui';
  import { SheetPanelLayout } from '@primebrick/ui';
  import { CircuitBoard } from '@primebrick/ui/vendor/lucide';

  let { ctx }: { ctx: ModuleSheetHost } = $props();
  const t = (key: string, params?: Record<string, unknown>) => ctx.i18n.t(key, params);

  const models = $derived((ctx.sheet.props['models'] ?? []) as readonly AiModel[]);
  const assistants = $derived(
    (ctx.sheet.props['assistants'] ?? []) as readonly { key: string; name: string }[],
  );
  const rows = $derived((ctx.sheet.props['rows'] ?? []) as readonly AiCerebellum[]);
  const onCreated = $derived(ctx.sheet.props['onCreated'] as (() => void) | undefined);

  const fieldNs = 'system.entities.ai_cerebellum.fields';

  let assistant_key = $state('');
  let model_id = $state('');
  let dtype = $state('');
  let enable_thinking = $state(false);
  let temperature = $state<number | null>(null);
  let top_p = $state<number | null>(null);
  let max_tokens = $state<number | null>(null);
  let repetition_penalty = $state<number | null>(null);
  let kv_cache_reuse = $state(false);
  let sliding_window = $state(true);
  let intent_detection = $state(false);
  let max_history_turns = $state<number | null>(null);
  let recommendation = $state<'RECOMMENDED' | 'NOT_RECOMMENDED' | ''>('');
  let saving = $state(false);

  // Fallback slider defaults for a NEW cerebellum (or when the selected model
  // lacks the value) — the values that performed best in our repeated tests.
  const CREATE_DEFAULTS = { temperature: 0.1, top_p: 0.8, max_tokens: 256, repetition_penalty: 1.1, max_history_turns: 6 };

  const assistantOptions = $derived(assistants.map((a) => ({ key: a.key, label: t(a.name) })));

  // Models are keyed by `model_id` transversally across dtypes — the catalog
  // has one row per (model_id, dtype) variant, so the model select must
  // dedupe by model_id and a separate dtype selector picks the variant.
  const modelOptions = $derived.by<AiModel[]>(() => {
    const seen = new Set<string>();
    return models.filter((m) => (seen.has(m.model_id) ? false : (seen.add(m.model_id), true)));
  });

  /** dtype variants available for the selected model. */
  const dtypeOptions = $derived(
    models.filter((m) => m.model_id === model_id && m.dtype).map((m) => m.dtype as string),
  );

  /** Variant identity stored in `ai_cerebellum.model_id` ("<model_id>#<dtype>"). */
  const variantModelId = $derived(modelVariantKey({ model_id, dtype: dtype || null }));

  // Default/reset dtype when the selected model changes.
  $effect(() => {
    const opts = dtypeOptions;
    dtype = opts.length === 1 ? opts[0] : (opts.includes(dtype) ? dtype : '');
  });

  /** Existing row for the selected pair — non-null = edit mode. */
  const existing = $derived(
    rows.find((r) => r.assistant_key === assistant_key && r.model_id === variantModelId) ?? null,
  );

  /** Selected model — its defaults are the values inherited when a field is NULL. */
  const selectedModel = $derived(
    models.find((m) => modelVariantKey(m) === variantModelId) ?? null,
  );

  // Prepopulate when the selected pair matches an existing row (edit mode).
  $effect(() => {
    const row = existing;
    if (!row) return;
    enable_thinking = row.enable_thinking ?? selectedModel?.enable_thinking ?? false;
    temperature = row.temperature ?? null;
    top_p = row.top_p ?? null;
    max_tokens = row.max_tokens ?? null;
    repetition_penalty = row.repetition_penalty ?? null;
    recommendation = row.recommendation ?? '';
  });

  // execution_config: cerebellum override ?? model config ?? tested defaults.
  $effect(() => {
    const cfg = existing?.execution_config ?? selectedModel?.execution_config ?? null;
    kv_cache_reuse = cfg?.kv_cache_reuse ?? false;
    sliding_window = cfg?.sliding_window ?? true;
    intent_detection = cfg?.intent_detection ?? false;
    max_history_turns = cfg?.max_history_turns ?? null;
  });

  async function save() {
    saving = true;
    const storedName = assistants.find((a) => a.key === assistant_key)?.name
      ?? `app.smart.${assistant_key}.ai.cerebellum_name`;
    const entity = {
      assistant_key,
      model_id: variantModelId,
      name: existing?.name ?? storedName,
      enable_thinking,
      temperature,
      top_p,
      max_tokens,
      repetition_penalty,
      execution_config: {
        kv_cache_reuse,
        sliding_window,
        intent_detection,
        ...(max_history_turns != null ? { max_history_turns } : {}),
      },
      recommendation: recommendation || null,
    };
    // Edit mode → PUT /:uuid with mandatory optimistic-lock version.
    const resp = existing
      ? await ctx.api(`/api/v1/entities/ai_cerebellum/${encodeURIComponent(existing.uuid)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity: { ...entity, version: existing.version } }),
        })
      : await ctx.api('/api/v1/entities/ai_cerebellum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity }),
        });
    saving = false;
    if (resp.ok) {
      ctx.sheet.close();
      onCreated?.();
    } else {
      ctx.notify({
        impact: 'MEDIUM',
        messageKey: 'app.common.saveFailed',
        scope: 'AI Cerebellum',
        detail: `Save failed (${resp.status})`,
        toast: true,
      });
    }
  }
</script>

<SheetPanelLayout contentClass="p-0" onClose={ctx.sheet.close}>
  {#snippet icon()}
    <CircuitBoard class="size-4" />
  {/snippet}

  {#snippet title()}
    {t('system.entities.ai_cerebellum.title')}
  {/snippet}

  <div class="space-y-4 p-4" data-testid="ai-cerebellum-panel">
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-muted-foreground" for="cerebellum-assistant">
          {t(`${fieldNs}.assistant_key`)}
        </label>
        <ComboSelect
          id="cerebellum-assistant"
          mode="single"
          bind:value={assistant_key}
          options={assistantOptions}
          valueField="key"
          labelField="label"
          placeholder={t(`${fieldNs}.assistant_key`)}
          data-testid="ai-cerebellum-assistant"
        />
      </div>

      <div class="space-y-1.5">
        <label class="flex items-center gap-2 text-xs font-medium text-muted-foreground" for="cerebellum-model">
          {t(`${fieldNs}.model_id`)}
          {#if recommendation}
            <CerebellumRecommendationBadge recommendation={recommendation} />
          {/if}
        </label>
        <ComboSelect
          id="cerebellum-model"
          mode="single"
          bind:value={model_id}
          options={modelOptions}
          valueField="model_id"
          labelField="name"
          placeholder={t(`${fieldNs}.model_id`)}
          display="custom"
          data-testid="ai-cerebellum-model"
        >
          {#snippet itemSnippet({ option })}
            {@const rec = (rows ?? []).find((r) => r.assistant_key === assistant_key && r.model_id === modelVariantKey(option as AiModel))?.recommendation}
            <div class="flex min-w-0 flex-1 items-center gap-2">
              <div class="min-w-0 flex-1">
                <AiModelOption model={option as AiModel} />
              </div>
              {#if rec}
                <CerebellumRecommendationBadge recommendation={rec} />
              {/if}
            </div>
          {/snippet}
          {#snippet selectedSnippet({ option })}
            <AiModelOption model={option as AiModel} />
          {/snippet}
        </ComboSelect>
      </div>

      {#if model_id && dtypeOptions.length > 0}
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted-foreground" for="cerebellum-dtype">
            {t('system.entities.ai_model.fields.dtype')}
          </label>
          <ComboSelect
            id="cerebellum-dtype"
            mode="single"
            bind:value={dtype}
            options={dtypeOptions}
            placeholder={t('system.entities.ai_model.fields.dtype')}
            searchable={false}
            data-testid="ai-cerebellum-dtype"
          />
        </div>
      {/if}

      <div class="grid grid-cols-2 gap-3">
        <SliderField size="sm" id="cerebellum-temperature" bind:value={temperature} label={t(`${fieldNs}.temperature`)} defaultValue={selectedModel?.temperature ?? CREATE_DEFAULTS.temperature} min={0} max={2} step={0.1} decimals={1} data-testid="ai-cerebellum-temperature" />
        <SliderField size="sm" id="cerebellum-top-p" bind:value={top_p} label={t(`${fieldNs}.top_p`)} defaultValue={selectedModel?.top_p ?? CREATE_DEFAULTS.top_p} min={0.01} max={1} step={0.01} decimals={2} data-testid="ai-cerebellum-top-p" />
        <SliderField size="sm" id="cerebellum-max-tokens" bind:value={max_tokens} label={t(`${fieldNs}.max_tokens`)} defaultValue={selectedModel?.max_tokens ?? CREATE_DEFAULTS.max_tokens} steps={[128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768]} data-testid="ai-cerebellum-max-tokens" />
        <SliderField size="sm" id="cerebellum-rep-penalty" bind:value={repetition_penalty} label={t(`${fieldNs}.repetition_penalty`)} defaultValue={selectedModel?.repetition_penalty ?? CREATE_DEFAULTS.repetition_penalty} min={1} max={2} step={0.01} decimals={2} data-testid="ai-cerebellum-repetition-penalty" />
      </div>

      <SwitchField
        size="sm"
        id="cerebellum-thinking"
        bind:checked={enable_thinking}
        label={t(`${fieldNs}.enable_thinking`)}
        data-testid="ai-cerebellum-thinking"
      />

      <SelectableFieldset label={t(`${fieldNs}.execution_config`)}>
        <div class="grid grid-cols-2 gap-3">
          <SwitchField
            size="sm"
            id="cerebellum-kv-cache"
            bind:checked={kv_cache_reuse}
            label={t(`${fieldNs}.kv_cache_reuse`)}
            data-testid="ai-cerebellum-kv-cache-reuse"
          />
          <SwitchField
            size="sm"
            id="cerebellum-sliding-window"
            bind:checked={sliding_window}
            label={t(`${fieldNs}.sliding_window`)}
            data-testid="ai-cerebellum-sliding-window"
          />
          <SwitchField
            size="sm"
            id="cerebellum-intent-detection"
            bind:checked={intent_detection}
            label={t(`${fieldNs}.intent_detection`)}
            data-testid="ai-cerebellum-intent-detection"
          />
          <SliderField size="sm" id="cerebellum-max-history" bind:value={max_history_turns} label={t(`${fieldNs}.max_history_turns`)} defaultValue={selectedModel?.execution_config?.max_history_turns ?? CREATE_DEFAULTS.max_history_turns} min={1} max={16} step={1} data-testid="ai-cerebellum-max-history-turns" />
        </div>
      </SelectableFieldset>

      <div class="space-y-1.5">
        <label class="text-xs font-medium text-muted-foreground" for="cerebellum-recommendation">
          {t(`${fieldNs}.recommendation`)}
        </label>
        <ComboSelect
          id="cerebellum-recommendation"
          mode="single"
          bind:value={recommendation}
          options={[
            { value: 'RECOMMENDED', label: t('app.smart.ai.cerebellum.recommended'), color: 'emerald-500' },
            { value: 'NOT_RECOMMENDED', label: t('app.smart.ai.cerebellum.not_recommended'), color: 'amber-500' },
          ]}
          valueField="value"
          labelField="label"
          searchable={false}
          display="badge"
          placeholder={t(`${fieldNs}.recommendation`)}
          data-testid="ai-cerebellum-recommendation"
        />
      </div>


    </div>

  {#snippet footer()}
    <div class="p-3">
      <Button variant="default" class="w-full" onclick={save} disabled={saving || !assistant_key || !model_id} data-testid="ai-cerebellum-save">
        {t('app.common.save')}
      </Button>
    </div>
  {/snippet}
</SheetPanelLayout>
