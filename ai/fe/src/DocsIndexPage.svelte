<script lang="ts">
  /**
   * DocsIndexPage — /system/ai/docs-index, module-owned (ai) remote page.
   *
   * Observability and controlled recovery for the ai-owned documentation
   * knowledge base (docs_kb / pgvector):
   *   - Index inventory: docs/chunks per repo, unembedded coverage, index size
   *   - Source-vs-index drift: what each service pack ships vs what is indexed
   *   - Ingestion history: docs_ingest_log (why, trigger, when, outcome)
   *   - Actions: force reindex (all or per-module) — recovery only, docs are
   *     authored in the source repos and ride the release, never live-edited
   *   - Search probes: canonical queries against the live index
   *
   * Data: GET  /svc/ai/api/v1/ai/docs/index-status   (via the 'ai' slot)
   *       POST /svc/ai/api/v1/ai/reindex {mode:'packs', repo?}
   */
  import { getT, getNotify } from '@primebrick/ui';
  import { onMount } from 'svelte';
  import { Button } from '@primebrick/ui';
  import { Badge } from '@primebrick/ui';
  import { fetchDocsIndexStatus, reindexDocsPacks, type DocsIndexStatus } from '@primebrick/ui';
  import { Hourglass, TriangleAlert, RefreshCw, BookSearch, CheckCircle2, XCircle, Database } from '@primebrick/ui/vendor/lucide';
  import { cn } from '@primebrick/ui';
  import type { ModulePageHost } from '@primebrick/ui';
  import type { AiPageComponents } from './host-contract';

  let { ctx }: { ctx: ModulePageHost } = $props();
  const comps = $derived(ctx.components as AiPageComponents | undefined);

  const t = getT();
  const notify = getNotify();

  // Breadcrumb — host-mounted once (module menu segment resolved host-side).
  let breadcrumbEl = $state<HTMLDivElement>();
  $effect(() => {
    const el = breadcrumbEl;
    const c = comps;
    if (!el || !c || !ctx.mount_host) return;
    const segments = c.moduleBreadcrumbSegments({ pathname: ctx.nav.route, t: (key) => $t(key) });
    const h = ctx.mount_host(c.AppPageBreadcrumb, el, { segments });
    return () => void h.destroy();
  });

  let status = $state<DocsIndexStatus | null>(null);
  let loading = $state(true);
  let probing = $state(false);
  let error = $state<string | null>(null);
  let reindexing = $state<string | null>(null); // repo being reindexed ('*' = all)

  const totalDocs = $derived(status?.repos.reduce((n, r) => n + Number(r.docs), 0) ?? 0);
  const totalChunks = $derived(status?.repos.reduce((n, r) => n + Number(r.chunks), 0) ?? 0);
  const totalUnembedded = $derived(status?.repos.reduce((n, r) => n + Number(r.unembedded_chunks), 0) ?? 0);

  function driftIssueCount(d: { missing_from_index?: string[]; stale?: string[]; orphans?: string[]; error?: string }): number {
    if (d.error) return 1;
    return (d.missing_from_index?.length ?? 0) + (d.stale?.length ?? 0) + (d.orphans?.length ?? 0);
  }

  function formatBytes(bytes: string | number | bigint | undefined): string {
    const n = Number(bytes ?? 0);
    if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${n} B`;
  }

  function formatWhen(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
  }

  async function load(probe = false) {
    if (probe) probing = true;
    else loading = true;
    error = null;
    try {
      status = await fetchDocsIndexStatus(probe);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load the index status';
      notify({
        impact: 'HIGH',
        messageKey: 'ai.docs.loadFailed',
        scope: $t('ai.docs.title'),
        detail: error,
      });
    } finally {
      loading = false;
      probing = false;
    }
  }

  async function reindex(repo?: string) {
    reindexing = repo ?? '*';
    try {
      const results = await reindexDocsPacks(repo);
      const failed = results.filter((r) => !r.ok);
      notify({
        impact: failed.length > 0 ? 'MEDIUM' : 'NONE',
        messageKey: failed.length > 0
          ? 'ai.docs.reindexFailed'
          : 'ai.docs.reindexDone',
        scope: $t('ai.docs.title'),
        detail: failed.length > 0 ? failed.map((f) => `${f.service}: ${f.error}`).join(' — ') : undefined,
      });
      await load();
    } catch (e) {
      notify({
        impact: 'HIGH',
        messageKey: 'ai.docs.reindexFailed',
        scope: $t('ai.docs.title'),
        detail: e instanceof Error ? e.message : undefined,
      });
    } finally {
      reindexing = null;
    }
  }

  onMount(() => load());
</script>

<!-- Remote-owned scaffold — same shell classes as the host AppPageScaffold
     (the host document's stylesheets apply to remote DOM). -->
<div class="h-full p-2 sm:p-3 contain-layout">
  <div class="flex h-full w-full flex-col gap-4 min-h-0 overflow-hidden">
    <header class="shrink-0">
      <div class="min-w-0 space-y-1">
        <div bind:this={breadcrumbEl}></div>
        <h1 class="truncate text-xl font-semibold leading-tight">{$t('ai.docs.title')}</h1>
        <p class="text-sm text-muted-foreground">{$t('ai.docs.description')}</p>
      </div>
    </header>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border bg-background">
      <div class="flex-1 overflow-auto p-4">
        {#if loading}
          <div class="grid min-h-56 place-items-center p-3">
            <div class="relative flex flex-col items-center gap-2 text-center">
              <div class="pb-watermark-loading"><Hourglass class="size-20 text-info" /></div>
              <div class="text-sm font-medium text-muted-foreground">{$t('app.common.loading')}</div>
            </div>
          </div>
        {:else if error && !status}
          <div class="grid min-h-56 place-items-center p-3">
            <div class="relative flex flex-col items-center gap-2 text-center">
              <div class="pb-watermark-empty"><TriangleAlert class="size-20 text-warning" /></div>
              <div class="text-sm font-medium text-muted-foreground">{$t('ai.docs.loadFailed')}</div>
              <Button variant="outline" size="sm" onclick={() => load()}>{$t('app.common.retry')}</Button>
            </div>
          </div>
        {:else if status}
          <div class="space-y-6">
            <!-- Index inventory -->
            <section class="space-y-2">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-semibold">{$t('ai.docs.section.index')}</h2>
                <div class="flex items-center gap-3 text-xs text-muted-foreground">
                  <span class="flex items-center gap-1"><Database class="size-3.5" />{$t('ai.docs.storage')}: {formatBytes(status.storage?.total_bytes)}</span>
                  <span>{totalDocs} docs · {totalChunks} chunks{#if totalUnembedded > 0} · <span class="text-destructive">{totalUnembedded} unembedded</span>{/if}</span>
                </div>
              </div>
              <div class="rounded-lg border">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                      <th class="px-3 py-2 font-medium">{$t('ai.docs.col.repo')}</th>
                      <th class="px-3 py-2 font-medium text-right">{$t('ai.docs.col.docs')}</th>
                      <th class="px-3 py-2 font-medium text-right">{$t('ai.docs.col.chunks')}</th>
                      <th class="px-3 py-2 font-medium text-right">{$t('ai.docs.col.unembedded')}</th>
                      <th class="px-3 py-2 font-medium text-right">{$t('ai.docs.col.contentSize')}</th>
                      <th class="px-3 py-2 font-medium text-right">{$t('ai.docs.col.vectorSize')}</th>
                      <th class="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each status.repos as repo (repo.repo)}
                      <tr class="border-b last:border-0">
                        <td class="px-3 py-2 font-mono text-xs">{repo.repo}</td>
                        <td class="px-3 py-2 text-right tabular-nums">{repo.docs}</td>
                        <td class="px-3 py-2 text-right tabular-nums">{repo.chunks}</td>
                        <td class="px-3 py-2 text-right tabular-nums" class:text-destructive={Number(repo.unembedded_chunks) > 0}>{repo.unembedded_chunks}</td>
                        <td class="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatBytes(repo.content_bytes)}</td>
                        <td class="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatBytes(repo.vector_bytes)}</td>
                        <td class="px-3 py-2 text-right">
                          <Button variant="ghost" size="icon" disabled={reindexing !== null} onclick={() => reindex(repo.repo)} title={$t('ai.docs.reindex')}>
                            <RefreshCw class={cn('size-3.5', reindexing === repo.repo && 'animate-spin')} />
                          </Button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Drift -->
            <section class="space-y-2">
              <h2 class="text-sm font-semibold">{$t('ai.docs.section.drift')}</h2>
              <div class="rounded-lg border">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                      <th class="px-3 py-2 font-medium">{$t('ai.docs.col.service')}</th>
                      <th class="px-3 py-2 font-medium text-right">{$t('ai.docs.col.expectedDocs')}</th>
                      <th class="px-3 py-2 font-medium text-right">{$t('ai.docs.col.expectedChunks')}</th>
                      <th class="px-3 py-2 font-medium text-right">{$t('ai.docs.missing')}</th>
                      <th class="px-3 py-2 font-medium text-right">{$t('ai.docs.stale')}</th>
                      <th class="px-3 py-2 font-medium text-right">{$t('ai.docs.orphans')}</th>
                      <th class="px-3 py-2 font-medium text-right">{$t('ai.docs.col.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each status.drift as d (d.service)}
                      <tr class="border-b last:border-0 align-top">
                        <td class="px-3 py-2 font-mono text-xs whitespace-nowrap">{d.service}</td>
                        <td class="px-3 py-2 text-right tabular-nums">{d.expected_docs ?? '—'}</td>
                        <td class="px-3 py-2 text-right tabular-nums">{d.expected_chunks ?? '—'}</td>
                        <td class="px-3 py-2 text-right tabular-nums" class:text-destructive={(d.missing_from_index?.length ?? 0) > 0}>{d.missing_from_index?.length ?? 0}</td>
                        <td class="px-3 py-2 text-right tabular-nums" class:text-warning={(d.stale?.length ?? 0) > 0}>{d.stale?.length ?? 0}</td>
                        <td class="px-3 py-2 text-right tabular-nums" class:text-muted-foreground={(d.orphans?.length ?? 0) > 0}>{d.orphans?.length ?? 0}</td>
                        <td class="px-3 py-2 text-right">
                          {#if d.error}
                            <Badge variant="outline" title={d.error} class="gap-1 border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300">
                              <XCircle class="size-3.5" />{$t('ai.docs.packError')}
                            </Badge>
                          {:else if driftIssueCount(d) === 0}
                            <Badge variant="outline" class="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 class="size-3.5" />{$t('ai.docs.aligned')}
                            </Badge>
                          {:else}
                            <Badge variant="outline" title={[...(d.missing_from_index ?? []), ...(d.stale ?? []), ...(d.orphans ?? [])].join('\n')} class="gap-1 border-yellow-500/25 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
                              <TriangleAlert class="size-3.5" />{$t('ai.docs.driftDetected')}
                            </Badge>
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Search probes -->
            <section class="space-y-2">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-semibold">{$t('ai.docs.section.probes')}</h2>
                <Button variant="outline" size="sm" disabled={probing} onclick={() => load(true)}>
                  <BookSearch class="size-3.5" />{#if probing}{$t('app.common.loading')}{:else}{$t('ai.docs.runProbes')}{/if}
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">{$t('ai.docs.probesHint')}</p>
              {#if status.probes}
                <div class="rounded-lg border">
                  <table class="w-full text-sm">
                    <tbody>
                      {#each status.probes as p (p.query)}
                        <tr class="border-b last:border-0 align-top">
                          <td class="px-3 py-2 w-1/3">
                            <span class="font-mono text-xs">"{p.query}"</span>
                          </td>
                          <td class="px-3 py-2">
                            {#if p.ok}
                              <Badge variant="outline" class="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 class="size-3.5" />ok
                              </Badge>
                            {:else}
                              <Badge variant="outline" class="gap-1 border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300">
                                <XCircle class="size-3.5" />miss
                              </Badge>
                            {/if}
                          </td>
                          <td class="px-3 py-2 text-xs text-muted-foreground">
                            {#each p.top.slice(0, 3) as hit}
                              <div class="font-mono">{hit.repo}:{hit.path} <span class="text-muted-foreground/60">({hit.similarity})</span></div>
                            {/each}
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
            </section>

            <!-- History -->
            <section class="space-y-2">
              <h2 class="text-sm font-semibold">{$t('ai.docs.section.history')}</h2>
              <div class="rounded-lg border">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                      <th class="px-3 py-2 font-medium">{$t('ai.docs.col.service')}</th>
                      <th class="px-3 py-2 font-medium">{$t('ai.docs.col.repo')}</th>
                      <th class="px-3 py-2 font-medium">{$t('ai.docs.col.trigger')}</th>
                      <th class="px-3 py-2 font-medium">{$t('ai.docs.col.result')}</th>
                      <th class="px-3 py-2 font-medium">{$t('ai.docs.col.when')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each status.history as h (h.id)}
                      <tr class="border-b last:border-0">
                        <td class="px-3 py-2 font-mono text-xs">{h.service_code}</td>
                        <td class="px-3 py-2 font-mono text-xs">{h.repo ?? '—'}</td>
                        <td class="px-3 py-2"><Badge variant="outline" class="text-[11px]">{h.trigger_source}</Badge></td>
                        <td class="px-3 py-2 text-xs">
                          {#if h.ok}
                            {@const s = h.stats as { docs_loaded?: number; chunks_embedded?: number; chunks_skipped?: number; chunks_deleted?: number }}
                            <span class="text-emerald-600 dark:text-emerald-400">ok</span>
                            <span class="text-muted-foreground">— {s.docs_loaded ?? '?'} docs, +{s.chunks_embedded ?? 0} ={s.chunks_skipped ?? 0} -{s.chunks_deleted ?? 0}</span>
                          {:else}
                            <span class="text-destructive">{h.error ?? 'failed'}</span>
                          {/if}
                        </td>
                        <td class="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{formatWhen(h.created_at)}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="bg-muted/50 shrink-0 border-t p-4">
        <div class="flex items-center justify-end gap-2">
          <Button variant="default" disabled={reindexing !== null} onclick={() => reindex()}>
            <RefreshCw class={cn('size-4', reindexing === '*' && 'animate-spin')} />
            {#if reindexing === '*'}{$t('ai.docs.reindexing')}{:else}{$t('ai.docs.reindexAll')}{/if}
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>
