/**
 * jobs-page chunk — `esm-mount` entry for the job module's remote sheets.
 *
 * Every page is host-rendered: the lists (/system/job/job-schedules,
 * /system/job/runs, /system/job/triggers) ride the standard
 * EntityTablePage archetype (kind:"list") and trigger create/detail ride
 * the EntityFormPage archetype (kind:"create"/"detail" + page_props.form).
 * The former manual-schedule page was absorbed — schedule-only triggers
 * are the declaration surface now, so no remote page mounts remain; the
 * chunk carries only the run-detail sheet.
 *
 * The host (`RemoteSheetMount`) imports this module and calls
 * mountSheet(el, ctx); the returned mount instance is disposed via
 * svelte's `unmount()` on teardown. The chunk is self-contained (bundles
 * svelte + @primebrick/ui).
 */
import { mountModuleContent, type ModuleSheetHost } from '@primebrick/ui';
import RunDetailSheet from './RunDetailSheet.svelte';

/**
 * Remote sheet entry — declared in `nav.sheets[]` (`job.runDetail`), mounted
 * by the host's RemoteSheetMount inside its global sheet surface. The host
 * owns the engine; the content is job-domain.
 */
export function mountSheet(el: HTMLElement, ctx: ModuleSheetHost) {
  return mountModuleContent(el, ctx, RunDetailSheet);
}
