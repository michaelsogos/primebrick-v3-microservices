/**
 * run-stats — module-scoped reactive run-statistics state for the jobs page.
 *
 * Lives at module level (not in a component) so REMOTE-mounted cell roots
 * (RemoteCellShell, mounted via the chunk's `cell_mount` export inside
 * host-rendered table cells) read the same `$state` map the page fills —
 * reactivity stays inside the remote bundle, nothing crosses the boundary.
 */
import { extJsonStringify, type ModulePageHost } from '@primebrick/ui';
import type { RunStatsBucket } from './RunStatsSparkline.svelte';

export const runStats = $state({
  by_subject: {} as Record<string, RunStatsBucket[]>,
  bucket_unit: 'day' as string,
});

/** Best-effort enrichment — the table still renders without buckets. */
export async function loadRunStats(
  ctx: ModulePageHost,
  rows: Array<Record<string, unknown>>,
): Promise<void> {
  const subjects = rows
    .map((r) => r.schedule_subject)
    .filter((s): s is string => typeof s === 'string' && s.length > 0);
  if (!subjects.length) return;
  try {
    const res = await ctx.api('/api/v1/actions/job-run-stats', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: extJsonStringify({ schedule_subjects: subjects }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      bucket_unit?: string;
      stats?: Record<string, RunStatsBucket[]>;
    };
    if (data.stats) {
      runStats.by_subject = { ...runStats.by_subject, ...data.stats };
      if (data.bucket_unit) runStats.bucket_unit = data.bucket_unit;
    }
  } catch {
    // sparkline is best-effort
  }
}
