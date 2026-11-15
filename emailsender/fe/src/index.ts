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
 * Dispatch rides `ctx.nav.route` (ai/crm precedent — the PAGES map is the
 * typed dispatcher; detail keys keep the declared `[param]` form because
 * ctx.nav is the route DECLARATION object, not the resolved URL).
 *
 * The host (`RemotePageMount`) imports this module and calls mountPage(el,
 * ctx); the returned mount instance is disposed via svelte's `unmount()`
 * on navigation/teardown.
 */
import { mountModuleContent, type ModulePageHost } from '@primebrick/ui';
import ProviderFormPage from './ProviderFormPage.svelte';
import TemplateFormPage from './TemplateFormPage.svelte';
import type { Component } from 'svelte';

const PAGES: Record<string, Component<{ ctx: ModulePageHost }>> = {
	'/system/emailsender/providers/create': ProviderFormPage,
	'/system/emailsender/providers/[uuid]': ProviderFormPage,
	'/system/emailsender/templates/create': TemplateFormPage,
	'/system/emailsender/templates/[uuid]': TemplateFormPage,
};

export function mountPage(el: HTMLElement, ctx: ModulePageHost) {
	const Page = PAGES[ctx.nav.route];
	if (!Page) throw new Error(`emailsender-pages: unknown route "${ctx.nav.route}"`);
	return mountModuleContent(el, ctx, Page);
}
