/**
 * jobs-page chunk — `esm-mount` entry for the job module's remote pages.
 *
 * The list pages (/system/job/job-schedules, /system/job/runs,
 * /system/job/rules) are host-rendered standard EntityTablePage
 * archetypes (kind:"list"); the rule-creation form (/system/job/rules/create)
 * rides the host EntityFormPage archetype (kind:"create" + page_props.form).
 * The remote chunk carries the ONE genuinely custom surface: the manual-
 * schedule form (/system/job/job-schedules/create).
 *
 * The host (`RemotePageMount`) imports this module and calls mountPage(el,
 * ctx); the returned mount instance is disposed via svelte's `unmount()`
 * on navigation/teardown. The chunk is self-contained (bundles svelte +
 * @primebrick/ui).
 */
import { mountModuleContent, type ModulePageHost, type ModuleSheetHost } from '@primebrick/ui';
import SchedulePage from './SchedulePage.svelte';
import RunDetailSheet from './RunDetailSheet.svelte';

export function mountPage(el: HTMLElement, ctx: ModulePageHost) {
  return mountModuleContent(el, ctx, SchedulePage);
}

/**
 * Remote sheet entry — declared in `nav.sheets[]` (`job.runDetail`), mounted
 * by the host's RemoteSheetMount inside its global sheet surface. The host
 * owns the engine; the content is job-domain.
 */
export function mountSheet(el: HTMLElement, ctx: ModuleSheetHost) {
  return mountModuleContent(el, ctx, RunDetailSheet);
}
