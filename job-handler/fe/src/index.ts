/**
 * jobs-page chunk — `esm-mount` entry for the job module's remote pages.
 *
 * The list pages (/jobs, /jobs/runs, /jobs/rules) are host-rendered standard
 * EntityTablePage archetypes (kind:"list"); the remote chunk carries the two
 * genuinely custom surfaces: the manual-schedule form (/jobs/new) and the
 * rule-creation form (/jobs/rules/new), dispatched by ctx.nav.route.
 *
 * The host (`RemotePageMount`) imports this module and calls mountPage(el,
 * ctx); the returned mount instance is disposed via svelte's `unmount()`
 * on navigation/teardown. The chunk is self-contained (bundles svelte +
 * @primebrick/ui).
 */
import { mount } from 'svelte';
import type { ModulePageHost } from '@primebrick/ui';
import SchedulePage from './SchedulePage.svelte';
import RuleFormPage from './RuleFormPage.svelte';

export function mountPage(el: HTMLElement, ctx: ModulePageHost) {
  const Page = ctx.nav.route === '/jobs/rules/new' ? RuleFormPage : SchedulePage;
  return mount(Page, { target: el, props: { ctx } });
}
