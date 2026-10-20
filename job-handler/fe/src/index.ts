/**
 * jobs-page chunk — `esm-mount` entry for the /jobs/new remote page.
 *
 * The job module's list pages (/jobs, /jobs/runs, /jobs/rules) are all
 * host-rendered standard EntityTablePage archetypes (kind:"list"); the
 * remote chunk carries only the manual-schedule form, the module's one
 * genuinely custom surface.
 *
 * The host (`RemotePageMount`) imports this module and calls mountPage(el,
 * ctx); the returned mount instance is disposed via svelte's `unmount()`
 * on navigation/teardown. The chunk is self-contained (bundles svelte +
 * @primebrick/ui).
 */
import { mount } from 'svelte';
import type { ModulePageHost } from '@primebrick/ui';
import SchedulePage from './SchedulePage.svelte';

export function mountPage(el: HTMLElement, ctx: ModulePageHost) {
  return mount(SchedulePage, { target: el, props: { ctx } });
}
