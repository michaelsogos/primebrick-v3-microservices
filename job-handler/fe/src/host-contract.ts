/**
 * host-contract — the remote page's view of `ctx.components` and
 * `ctx.mount_host`. Host values are opaque at this boundary (typed as the
 * shapes the remote consumes); the wire contract lives in
 * `@primebrick/ui`'s `ModulePageHost`.
 */
import type { Component } from 'svelte';

/** `ctx.components` for the remote schedule page — provided by the FE shim. */
export type JobsComponents = {
  AppPageBreadcrumb: Component<Record<string, unknown>>;
  /** Host Button — leaf-mounted via <HostLeaf> (ctx.mount_host). */
  Button: Component<Record<string, unknown>>;
  /**
   * HOST-bound module breadcrumb segments — returns the two mechanical
   * segments {module-link, page-menu} built from the resolved module nav
   * in the host (module label links to its home in the route's root;
   * page menu lists sibling pages with the current one marked).
   */
  moduleBreadcrumbSegments: (args: { pathname: string; t: (key: string) => string }) => unknown;
};
