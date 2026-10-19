/**
 * jobs-page chunk — `esm-mount` entry for the /system/jobs remote page.
 *
 * The host (`RemotePageMount`) imports this module and calls mountPage(el,
 * ctx); the returned mount instance is disposed via svelte's `unmount()` on
 * navigation/teardown. The chunk is self-contained (bundles svelte +
 * @primebrick/ui) — see ai-plans/table-pages-merge.md Part I.4.
 *
 * `cell_mount` is the inbound bridge: host-rendered table cells route
 * module-owned cell types (run_stats_sparkline, duration_ms) to a remote
 * root mounted here — remote content inside host trees always travels as
 * a separately mounted root, never as a cross-bundle snippet.
 */
import { mount, unmount } from 'svelte';
import type { HostMountHandle, MetaColumn, ModulePageHost } from '@primebrick/ui';
import JobsPage from './JobsPage.svelte';
import RemoteCellShell from './RemoteCellShell.svelte';

export function mountPage(el: HTMLElement, ctx: ModulePageHost) {
  return mount(JobsPage, { target: el, props: { ctx } });
}

/**
 * Mount a module-owned cell renderer into a host-provided anchor element
 * (used by the host shim's `jobs_cell` snippet via RemoteMountSlot).
 */
export function cell_mount(el: HTMLElement, props: Record<string, unknown>): HostMountHandle {
  const ref = mount(RemoteCellShell, {
    target: el,
    props: {
      initial: props as { row: Record<string, unknown>; column: MetaColumn },
    },
  }) as { update: (patch: Record<string, unknown>) => void };
  return {
    update: (patch) => ref.update(patch),
    destroy: () => unmount(ref),
  };
}
