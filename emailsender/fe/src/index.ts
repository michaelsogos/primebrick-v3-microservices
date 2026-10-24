/**
 * emailsender-pages chunk — `esm-mount` entry for the emailsender module's
 * remote pages.
 *
 * The providers list (/system/emailsender/providers) is the host-rendered
 * standard EntityTablePage archetype (kind:"list"); this chunk carries the
 * custom form surface: provider create (/providers/create) and edit
 * (/providers/[uuid]), dispatched by ctx.nav.kind. The record uuid on the
 * detail route arrives via ctx.components.params (host-injected).
 *
 * The host (`RemotePageMount`) imports this module and calls mountPage(el,
 * ctx); the returned mount instance is disposed via svelte's `unmount()`
 * on navigation/teardown.
 */
import { mountModuleContent, type ModulePageHost } from '@primebrick/ui';
import ProviderFormPage from './ProviderFormPage.svelte';

export function mountPage(el: HTMLElement, ctx: ModulePageHost) {
  return mountModuleContent(el, ctx, ProviderFormPage);
}
