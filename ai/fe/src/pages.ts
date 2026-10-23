/**
 * ai-pages chunk — `esm-mount` entry for the ai module's remote pages.
 *
 * Declared in `endpoints.nav.routes[]` (`/system/ai`, `/system/ai/docs-index`,
 * kind:"page" — see src/nav-declaration.ts), resolved by the FE shells from
 * the routes census and mounted via RemotePageMount → mountPage(el, ctx).
 * Dispatch rides `ctx.nav.route` (job-handler precedent).
 *
 * `bindRemoteCtx(ctx, { service: 'ai' })` wires the shared-UI bridges
 * (i18n/notify/service-api/sheet/step-up) so composables resolve the ai
 * service API (`/ws/ai/api/v1`) — including the ai-schema config entries —
 * instead of the host's.
 */
import { bindRemoteCtx, mountModuleContent, type ModulePageHost } from '@primebrick/ui';
import AiSettingsPage from './AiSettingsPage.svelte';
import DocsIndexPage from './DocsIndexPage.svelte';
import type { Component } from 'svelte';

const PAGES: Record<string, Component<{ ctx: ModulePageHost }>> = {
	'/system/ai': AiSettingsPage,
	'/system/ai/docs-index': DocsIndexPage,
};

export function mountPage(el: HTMLElement, ctx: ModulePageHost) {
	bindRemoteCtx(ctx, { service: 'ai' });
	const Page = PAGES[ctx.nav.route];
	if (!Page) throw new Error(`ai-pages: unknown route "${ctx.nav.route}"`);
	return mountModuleContent(el, ctx, Page);
}
