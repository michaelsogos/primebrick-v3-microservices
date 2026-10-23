/**
 * jobs-page chunk — `esm-mount` entry for the job module's remote pages.
 *
 * The list pages (/system/job/job-schedules, /system/job/runs,
 * /system/job/rules) are host-rendered standard EntityTablePage
 * archetypes (kind:"list"); the remote chunk carries the two genuinely
 * custom surfaces: the manual-schedule form
 * (/system/job/job-schedules/create) and the rule-creation form
 * (/system/job/rules/create), dispatched by ctx.nav.route.
 *
 * The host (`RemotePageMount`) imports this module and calls mountPage(el,
 * ctx); the returned mount instance is disposed via svelte's `unmount()`
 * on navigation/teardown. The chunk is self-contained (bundles svelte +
 * @primebrick/ui).
 */
import { mount } from 'svelte';
import type { ModulePageHost, ModuleSheetHost } from '@primebrick/ui';
import SchedulePage from './SchedulePage.svelte';
import RuleFormPage from './RuleFormPage.svelte';
import RunDetailSheet from './RunDetailSheet.svelte';

export function mountPage(el: HTMLElement, ctx: ModulePageHost) {
  const Page = ctx.nav.route === '/system/job/rules/create' ? RuleFormPage : SchedulePage;
  return mount(Page, { target: el, props: { ctx } });
}

/**
 * Remote sheet entry — declared in `nav.sheets[]` (`job.runDetail`), mounted
 * by the host's RemoteSheetMount inside its global sheet surface. The host
 * owns the engine; the content is job-domain.
 */
export function mountSheet(el: HTMLElement, ctx: ModuleSheetHost) {
  return mount(RunDetailSheet, { target: el, props: { ctx } });
}
