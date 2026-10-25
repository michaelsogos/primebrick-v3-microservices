<script lang="ts">
  /**
   * TemplateFormPage — module-owned (emailsender) remote form page for
   * `/system/emailsender/templates/create` and `/templates/[uuid]`.
   *
   * The templates list is the host-rendered EntityTablePage archetype;
   * create/edit are custom forms (the MJML/HTML/text bodies are plain
   * source editing — no preview pipeline by requirement).
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

  let code = $state('');
  let languageIso = $state('');
  let subject = $state('');
  let bodyHtml = $state('');
  let bodyText = $state('');
  let mjmlSource = $state('');
  let variablesJson = $state('');
  let version = $state(0);
  // untrack: the initial loading flag intentionally captures mount-time
  // mode — detail routes load the record, create routes render the form.
  let loading = $state(untrack(() => !isCreate));
  let busy = $state(false);

  onMount(() => {
    if (isCreate || !uuid) return;
    void (async () => {
      try {
        const res = await ctx.api(`/api/v1/entities/email_template/${uuid}`);
        if (!res.ok) throw new Error(`LOAD_FAILED:${res.status}`);
        const row = (await res.json()) as Record<string, unknown>;
        code = (row.code as string) ?? '';
        languageIso = (row.language_iso as string) ?? '';
        subject = (row.subject as string) ?? '';
        bodyHtml = (row.body_html as string) ?? '';
        bodyText = (row.body_text as string) ?? '';
        mjmlSource = (row.mjml_source as string) ?? '';
        variablesJson = row.variables == null ? '' : JSON.stringify(row.variables, null, 2);
        version = Number(row.version ?? 0);
      } catch (e) {
        ctx.notify({
          impact: 'MEDIUM',
          message: e instanceof Error ? e.message : 'LOAD_FAILED',
          scope: 'templates',
        });
      } finally {
        loading = false;
      }
    })();
  });

  /** `variables` is JSONB — free text is legal only when it parses to an object. */
  const parsedVariables = $derived.by(() => {
    const raw = variablesJson.trim();
    if (!raw) return { ok: true as const, value: null };
    try {
      const v = JSON.parse(raw) as unknown;
      if (v === null || typeof v !== 'object' || Array.isArray(v)) {
        return { ok: false as const };
      }
      return { ok: true as const, value: v as Record<string, unknown> };
    } catch {
      return { ok: false as const };
    }
  });

  const validationError = $derived.by(() => {
    if (!code.trim()) return 'emailsender.templates.errors.codeRequired';
    if (!languageIso.trim()) return 'emailsender.templates.errors.languageRequired';
    if (!parsedVariables.ok) return 'emailsender.templates.errors.invalidVariablesJson';
    return null;
  });

  async function submit() {
    if (validationError || !parsedVariables.ok) return;
    busy = true;
    try {
      const entity: Record<string, unknown> = {
        code: code.trim(),
        language_iso: languageIso.trim(),
        subject: subject.trim() || null,
        body_html: bodyHtml || null,
        body_text: bodyText || null,
        mjml_source: mjmlSource || null,
        variables: parsedVariables.value,
      };

      const res = isCreate
        ? await ctx.api('/api/v1/entities/email_template', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: extJsonStringify({ entity }),
          })
        : await ctx.api(`/api/v1/entities/email_template/${uuid}`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: extJsonStringify({ entity: { ...entity, version } }),
          });
      if (!res.ok) throw new Error(`SAVE_FAILED:${res.status}`);
      ctx.notify({
        impact: 'LOW',
        message: t(
          isCreate
            ? 'emailsender.templates.notifications.created'
            : 'emailsender.templates.notifications.updated',
        ),
        scope: 'templates',
      });
      window.location.assign('/system/emailsender/templates');
    } catch (e) {
      ctx.notify({
        impact: 'MEDIUM',
        message: e instanceof Error ? e.message : 'SAVE_FAILED',
        scope: 'templates',
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
              ? 'emailsender.templates.createTemplate'
              : 'emailsender.templates.editTemplate',
          )}
        </h1>
      </div>
    </header>

    <div class="flex min-h-0 flex-col overflow-y-auto">
      {#if loading}
        <p class="text-muted-foreground text-sm">{t('app.remote_page.loading')}</p>
      {:else}
        <form
          class="grid w-full max-w-2xl gap-4"
          onsubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div class="grid grid-cols-2 gap-3">
            <div class="grid gap-1.5">
              <label class="text-sm font-medium leading-none" for="tpl-code">
                {t('emailsender.templates.code')}
              </label>
              <input
                id="tpl-code"
                class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                bind:value={code}
                placeholder="welcome"
                required
              />
            </div>
            <div class="grid gap-1.5">
              <label class="text-sm font-medium leading-none" for="tpl-lang">
                {t('emailsender.templates.languageIso')}
              </label>
              <input
                id="tpl-lang"
                class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                bind:value={languageIso}
                placeholder="it-IT"
                required
              />
            </div>
          </div>
          <div class="grid gap-1.5">
            <label class="text-sm font-medium leading-none" for="tpl-subject">
              {t('emailsender.templates.subject')}
            </label>
            <input
              id="tpl-subject"
              class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              bind:value={subject}
            />
          </div>
          <div class="grid gap-1.5">
            <label class="text-sm font-medium leading-none" for="tpl-mjml">
              {t('emailsender.templates.mjmlSource')}
            </label>
            <textarea
              id="tpl-mjml"
              class="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 font-mono text-xs"
              bind:value={mjmlSource}
            ></textarea>
          </div>
          <div class="grid gap-1.5">
            <label class="text-sm font-medium leading-none" for="tpl-html">
              {t('emailsender.templates.bodyHtml')}
            </label>
            <textarea
              id="tpl-html"
              class="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 font-mono text-xs"
              bind:value={bodyHtml}
            ></textarea>
          </div>
          <div class="grid gap-1.5">
            <label class="text-sm font-medium leading-none" for="tpl-text">
              {t('emailsender.templates.bodyText')}
            </label>
            <textarea
              id="tpl-text"
              class="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 font-mono text-xs"
              bind:value={bodyText}
            ></textarea>
          </div>
          <div class="grid gap-1.5">
            <label class="text-sm font-medium leading-none" for="tpl-vars">
              {t('emailsender.templates.variables')}
            </label>
            <textarea
              id="tpl-vars"
              class="border-input bg-background min-h-16 w-full rounded-md border px-3 py-2 font-mono text-xs"
              bind:value={variablesJson}
              placeholder={'{"name": "…"}'}
            ></textarea>
            <p class="text-muted-foreground text-xs">{t('emailsender.templates.variablesHint')}</p>
          </div>
          {#if validationError}
            <p class="text-destructive text-xs">{t(validationError)}</p>
          {/if}
          {#if comps}
            <div class="flex justify-end gap-2">
              <a
                href="/system/emailsender/templates"
                class="border-input bg-background inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
              >
                {t('emailsender.templates.cancel')}
              </a>
              <HostLeaf
                {ctx}
                comp={comps.Button}
                props={{
                  label: t('emailsender.templates.save'),
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
