<script lang="ts">
  /**
   * RemoteCellShell — remote root mounted by the chunk's `cell_mount` export
   * inside a host-provided anchor (HostMountSlot). Mirror of the host's
   * HostMountShell: `update()` is the imperative prop channel — no rune
   * signals cross the bundle boundary.
   *
   * Renders the module-owned cell types; the host shim only routes special
   * columns here. Sparkline reads the module-level `runStats` store — same
   * bundle, fully reactive.
   */
  import { untrack } from 'svelte';
  import type { MetaColumn } from '@primebrick/ui';
  import RunStatsSparkline from './RunStatsSparkline.svelte';
  import { runStats } from './run-stats.svelte';

  type Row = Record<string, unknown>;

  let {
    initial,
  }: {
    initial: { row: Row; column: MetaColumn };
  } = $props();

  // untrack: `initial` is a snapshot — later prop changes arrive via update().
  let current = $state<{ row: Row; column: MetaColumn }>(untrack(() => initial));

  export function update(patch: Record<string, unknown>) {
    current = { ...current, ...patch };
  }

  const subject = $derived(String(current.row?.schedule_subject ?? ''));

  /** Scalable UoM: 312ms → "312ms", 67000 → "1m 07s", 7.4e6 → "2h 03m". */
  function humanizeMs(value: unknown): string {
    const ms = Number(value ?? NaN);
    if (!Number.isFinite(ms)) return '—';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
    const h = Math.floor(m / 60);
    return `${h}h ${String(m % 60).padStart(2, '0')}m`;
  }
</script>

{#if current.column?.type === 'run_stats_sparkline'}
  <RunStatsSparkline
    buckets={runStats.by_subject[subject]}
    bucketUnit={runStats.bucket_unit}
  />
{:else if current.column?.key === 'duration_ms'}
  <span class="min-w-0 truncate">{humanizeMs(current.row?.duration_ms)}</span>
{/if}
