/**
 * emailsender-pages chunk — `esm-mount` entry for the emailsender module's
 * remote pages.
 *
 * The entity lists (/system/emailsender/{providers,templates}) are the
 * host-rendered standard EntityTablePage archetype (kind:"list"); this
 * chunk carries the custom form surfaces, dispatched on the decl route:
 * providers create/edit → ProviderFormPage, templates create/edit →
 * TemplateFormPage. The record uuid on detail routes arrives via
 * ctx.components.params (host-injected).
 *
 * The host (`RemotePageMount`) imports this module and calls mountPage(el,
 * ctx); the returned mount instance is disposed via svelte's `unmount()`
 * on navigation/teardown.
 */
import { mountModuleContent, type ModulePageHost } from '@primebrick/ui';
import ProviderFormPage from './ProviderFormPage.svelte';
import TemplateFormPage from './TemplateFormPage.svelte';

export function mountPage(el: HTMLElement, ctx: ModulePageHost) {
  const page = ctx.nav.route.startsWith('/system/emailsender/templates')
    ? TemplateFormPage
    : ProviderFormPage;
  return mountModuleContent(el, ctx, page);
}
