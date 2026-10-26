/**
 * crm-pages chunk — `esm-mount` entry for the crm module's remote pages.
 *
 * Declared in `endpoints.nav.routes[]` (`/crm/customers/new` kind:"create",
 * `/system/crm/pipeline` kind:"page" — see src/nav-declaration.ts),
 * resolved by the FE shells from the routes census and mounted via
 * RemotePageMount → mountPage(el, ctx). Dispatch rides `ctx.nav.route`
 * (ai precedent — the PAGES map is the typed dispatcher).
 *
 * `bindRemoteCtx(ctx, { service: 'crm' })` wires the shared-UI bridges
 * (i18n/notify/service-api/sheet/step-up) so composables resolve the crm
 * service API (`/ws/crm/api/v1`) and the `crm.*` translation namespace
 * instead of the host's.
 */
import { bindRemoteCtx, mountModuleContent, type ModulePageHost } from '@primebrick/ui';
import CustomerCreatePage from './CustomerCreatePage.svelte';
import PipelinePage from './PipelinePage.svelte';
import type { Component } from 'svelte';

const PAGES: Record<string, Component<{ ctx: ModulePageHost }>> = {
  '/crm/customers/create': CustomerCreatePage,
  '/system/crm/pipeline': PipelinePage,
};

export function mountPage(el: HTMLElement, ctx: ModulePageHost) {
  bindRemoteCtx(ctx, { service: 'crm' });
  const Page = PAGES[ctx.nav.route];
  if (!Page) throw new Error(`crm-pages: unknown route "${ctx.nav.route}"`);
  return mountModuleContent(el, ctx, Page);
}
