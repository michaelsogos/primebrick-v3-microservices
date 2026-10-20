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
   * HOST-bound breadcrumb menu segment — builds the module's nav menu
   * (links + current detection) from the resolved module nav in the host.
   */
  moduleMenuSegment: (args: { pathname: string; t: (key: string) => string }) => unknown;
};
