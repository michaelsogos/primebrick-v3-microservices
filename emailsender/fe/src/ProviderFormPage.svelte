<script lang="ts">
  /**
   * ProviderFormPage — module-owned (emailsender) remote form page for
   * `/system/emailsender/providers/create` and `/providers/[uuid]`.
   *
   * The providers list is the host-rendered EntityTablePage archetype;
   * create/edit are custom forms (secret-field UX: api_key is never
   * re-shown — blank on edit means "keep the stored key", matching the
   * pre-migration semantics).
   *
   * Rendering boundaries (cross-bundle rules — snippets NEVER cross):
   *   - AppPageBreadcrumb / Button are HOST components mounted via
   *     ctx.mount_host as separate roots (HostLeaf for leaf granularity).
   *   - moduleBreadcrumbSegments is a host-state-bound function passed
   *     through ctx.components — it reads the resolved module nav.
   *   - The record uuid on the detail route arrives via
   *     ctx.components.params (injected by the host shim).
   */
  import { onMount, untrack } from 'svelte';
  import { extJsonStringify, type ModulePageHost } from '@primebrick/ui';
  import HostLeaf from './HostLeaf.svelte';
  import type { EmailsenderComponents } from './host-contract';

  let { ctx }: { ctx: ModulePageHost } = $props();
  const comps = $derived(ctx.components as EmailsenderComponents | undefined);
  const t = (key: string, params?: Record<string, unknown>) => ctx.i18n.t(key, params);

  // Route mode + record identity are fixed at mount — the decl route and
  // host-injected params never change for a mounted page.
  const isCreate = $derived(ctx.nav.kind === 'create');
  const uuid = $derived((ctx.components as EmailsenderComponents | undefined)?.params?.uuid);

  // Breadcrumb — host-mounted once (module menu segment resolved host-side).
  let breadcrumbEl = $state<HTMLDivElement>();
  $effect(() => {
    const el = breadcrumbEl;
    const c = comps;
    if (!el || !c || !ctx.mount_host) return;
    const segments = c.moduleBreadcrumbSegments({ pathname: ctx.nav.route, t });
    const h = ctx.mount_host(c.AppPageBreadcrumb, el, { segments });
    return () => void h.destroy();
  });

  let provider = $state('');
  let apiKey = $state('');
  let apiEndpoint = $state('');
  let fromEmail = $state('');
  let fromName = $state('');
  let replyTo = $state('');
  let version = $state(0);
  // untrack: the initial loading flag intentionally captures mount-time
  // mode — detail routes load the record, create routes render the form.
  let loading = $state(untrack(() => !isCreate));
  let busy = $state(false);

  onMount(() => {
    if (isCreate || !uuid) return;
    void (async () => {
      try {
        const res = await ctx.api(`/api/v1/entities/provider/${uuid}`);
        if (!res.ok) throw new Error(`LOAD_FAILED:${res.status}`);
        const row = (await res.json()) as Record<string, unknown>;
        provider = (row.provider as string) ?? '';
        apiEndpoint = (row.api_endpoint as string) ?? '';
        fromEmail = (row.from_email as string) ?? '';
        fromName = (row.from_name as string) ?? '';
        replyTo = (row.reply_to as string) ?? '';
        version = Number(row.version ?? 0);
      } catch (e) {
        ctx.notify({
          impact: 'MEDIUM',
          message: e instanceof Error ? e.message : 'LOAD_FAILED',
          scope: 'providers',
        });
      } finally {
        loading = false;
      }
    })();
  });

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validationError = $derived.by(() => {
    if (!provider.trim()) return 'emailsender.providers.errors.providerRequired';
    if (isCreate && !apiKey.trim()) return 'emailsender.providers.errors.apiKeyRequired';
    for (const addr of [fromEmail, replyTo]) {
      if (addr.trim() && !EMAIL_RE.test(addr.trim()))
        return 'emailsender.providers.errors.invalidEmail';
    }
    return null;
  });

  async function submit() {
    if (validationError) return;
    busy = true;
    try {
      const entity: Record<string, unknown> = {
        provider: provider.trim(),
        api_endpoint: apiEndpoint.trim() || null,
        from_email: fromEmail.trim() || null,
        from_name: fromName.trim() || null,
        reply_to: replyTo.trim() || null,
      };
      // api_key: create always sends it; edit sends it only when the user
      // typed a replacement (blank = keep the stored key).
      if (isCreate || apiKey.trim()) entity.api_key = apiKey.trim();

      const res = isCreate
        ? await ctx.api('/api/v1/entities/provider', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: extJsonStringify({ entity }),
          })
        : await ctx.api(`/api/v1/entities/provider/${uuid}`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: extJsonStringify({ entity: { ...entity, version } }),
          });
      if (!res.ok) throw new Error(`SAVE_FAILED:${res.status}`);
      ctx.notify({
        impact: 'LOW',
        message: t(
          isCreate
            ? 'emailsender.providers.notifications.created'
            : 'emailsender.providers.notifications.updated',
        ),
        scope: 'providers',
      });
      window.location.assign('/system/emailsender/providers');
    } catch (e) {
      ctx.notify({
        impact: 'MEDIUM',
        message: e instanceof Error ? e.message : 'SAVE_FAILED',
        scope: 'providers',
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
          {t(
            isCreate
              ? 'emailsender.providers.createProvider'
              : 'emailsender.providers.editProvider',
          )}
        </h1>
      </div>
    </header>

    <div class="flex min-h-0 flex-col overflow-y-auto">
      {#if loading}
        <p class="text-muted-foreground text-sm">{t('app.remote_page.loading')}</p>
      {:else}
        <form
          class="grid w-full max-w-lg gap-4"
          onsubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div class="grid gap-1.5">
            <label class="text-sm font-medium leading-none" for="prov-name">
              {t('emailsender.providers.providerName')}
            </label>
            <input
              id="prov-name"
              class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              bind:value={provider}
              placeholder="brevo"
              required
            />
          </div>
          <div class="grid gap-1.5">
            <label class="text-sm font-medium leading-none" for="prov-key">
              {t('emailsender.providers.apiKey')}
            </label>
            <input
              id="prov-key"
              type="password"
              class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              bind:value={apiKey}
              required={isCreate}
              autocomplete="off"
            />
            {#if !isCreate}
              <p class="text-muted-foreground text-xs">{t('emailsender.providers.apiKeyLeaveBlank')}</p>
            {/if}
          </div>
          <div class="grid gap-1.5">
            <label class="text-sm font-medium leading-none" for="prov-endpoint">
              {t('emailsender.providers.apiEndpoint')}
            </label>
            <input
              id="prov-endpoint"
              class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              bind:value={apiEndpoint}
              placeholder="https://api.brevo.com/v3"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="grid gap-1.5">
              <label class="text-sm font-medium leading-none" for="prov-from-email">
                {t('emailsender.providers.fromEmail')}
              </label>
              <input
                id="prov-from-email"
                type="email"
                class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                bind:value={fromEmail}
              />
            </div>
            <div class="grid gap-1.5">
              <label class="text-sm font-medium leading-none" for="prov-from-name">
                {t('emailsender.providers.fromName')}
              </label>
              <input
                id="prov-from-name"
                class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                bind:value={fromName}
              />
            </div>
          </div>
          <div class="grid gap-1.5">
            <label class="text-sm font-medium leading-none" for="prov-reply">
              {t('emailsender.providers.replyTo')}
            </label>
            <input
              id="prov-reply"
              type="email"
              class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              bind:value={replyTo}
            />
          </div>
          {#if validationError}
            <p class="text-destructive text-xs">{t(validationError)}</p>
          {/if}
          {#if comps}
            <div class="flex justify-end gap-2">
              <a
                href="/system/emailsender/providers"
                class="border-input bg-background inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
              >
                {t('emailsender.providers.cancel')}
              </a>
              <HostLeaf
                {ctx}
                comp={comps.Button}
                props={{
                  label: t('emailsender.providers.save'),
                  disabled: busy || !!validationError,
                  onclick: () => void submit(),
                }}
              />
            </div>
          {/if}
        </form>
      {/if}
    </div>
  </div>
</div>
