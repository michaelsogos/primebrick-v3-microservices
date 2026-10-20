/**
 * jobs-page chunk — `esm-mount` entry for the /system/jobs remote page.
 *
 * The host (`RemotePageMount`) imports this module and calls mountPage(el,
 * ctx); the returned mount instance is disposed via svelte's `unmount()` on
 * navigation/teardown. The chunk is self-contained (bundles svelte +
 * @primebrick/ui) — see ai-plans/table-pages-merge.md Part I.4.
 *
 * All cell rendering is HOST-side: `type:"sparkline"` columns are the
 * table's builtin (fed by the list engine's meta-declared batch fetch),
 * so no remote `cell_mount` bridge is needed.
 */
import { mount } from 'svelte';
import type { ModulePageHost } from '@primebrick/ui';
import JobsPage from './JobsPage.svelte';

export function mountPage(el: HTMLElement, ctx: ModulePageHost) {
  return mount(JobsPage, { target: el, props: { ctx } });
}
