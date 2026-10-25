/**
 * ai-sheets chunk — `esm-mount` entry for the ai module's remote sheets.
 *
 * Sheets are declared in `endpoints.nav.sheets[]` (`ai.<name>` keys — see
 * src/nav-declaration.ts), resolved globally by the host's sheet engine,
 * and mounted at runtime inside the host-owned chrome. The host owns the
 * engine; this chunk owns the ai-domain content.
 *
 * `bindRemoteCtx(ctx, { service: 'ai' })` wires the shared-UI bridges
 * (i18n/notify/service-api/sheet) so composables like `useAiModels` and
 * composites like `ModelCacheSection` resolve the ai service API
 * (`/ws/ai/api/v1`) instead of the host's.
 */
import { bindRemoteCtx, mountModuleContent, type ModuleSheetHost } from '@primebrick/ui';
import ModelCacheSheet from './ModelCacheSheet.svelte';
import ModelTestReportSheet from './ModelTestReportSheet.svelte';
import CerebellumSheet from './CerebellumSheet.svelte';
import ModelImportSheet from './ModelImportSheet.svelte';
import type { Component } from 'svelte';

const PANELS: Record<string, Component<{ ctx: ModuleSheetHost }>> = {
	'ai.modelCache': ModelCacheSheet,
	'ai.modelTestReport': ModelTestReportSheet,
	'ai.cerebellum': CerebellumSheet,
	'ai.modelImport': ModelImportSheet,
};

export function mountSheet(el: HTMLElement, ctx: ModuleSheetHost) {
	bindRemoteCtx(ctx, { service: 'ai' });
	const Panel = PANELS[ctx.sheet.key];
	if (!Panel) throw new Error(`ai-sheets: unknown sheet key "${ctx.sheet.key}"`);
	return mountModuleContent(el, ctx, Panel);
}
