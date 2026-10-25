<script lang="ts">
  /**
   * HostLeaf — fine-grained `mount_host` consumer for remote module pages.
   *
   * Mounts a host component (e.g. the app's Button) as a separate Svelte
   * root inside remote DOM and pushes prop changes through the handle's
   * imperative `update()` channel — the leaf-granularity version of the
   * table/breadcrumb mount pattern. Use for small host-chrome widgets where
   * remote-owned markup would drift from app styling.
   *
   * Cross-bundle rendering rule: components and snippets can NEVER render
   * inline under the other bundle's tree — separate roots only.
   */
  import { untrack } from 'svelte';
  import type { HostMountHandle, ModulePageHost } from '@primebrick/ui';

  let {
    ctx,
    comp,
    props = {},
  }: {
    ctx: ModulePageHost;
    /** Host component (from ctx.components) to root-mount. */
    comp: unknown;
    /** Plain-values props — updates flow through handle.update(). */
    props?: Record<string, unknown>;
  } = $props();

  let el = $state<HTMLSpanElement>();
  let handle: HostMountHandle | null = null;

  $effect(() => {
    const target = el;
    if (!target || !comp || !ctx.mount_host) return;
    // untrack: the initial props snapshot must not subscribe this mount
    // effect — updates flow through the companion effect below.
    handle = ctx.mount_host(comp, target, untrack(() => props));
    return () => {
      void handle?.destroy();
      handle = null;
    };
  });

  $effect(() => {
    handle?.update?.(props);
  });
</script>

<span bind:this={el} class="contents"></span>
