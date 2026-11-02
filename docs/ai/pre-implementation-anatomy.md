# Pre-Implementation Anatomy Protocol (remote module pages)

**Applies to:** every remote page/component a service's `fe/` bundle
implements or modifies, and every service-side metadata surface that
drives host-rendered anatomy (entity `meta.columns`, `page_props.form`,
nav declarations, `events.emits`).

This protocol exists because every recurring anatomy regression (missing
breadcrumb, dropped clear CTA, overlapped trailing icons, unspaced footer
CTAs, metadata features declared-but-unpopulated) has the same root
cause: **implementation from memory instead of from the canonical
reference consumer and the contract's own declaration surface.** Good
intentions are not enforcement — these gates are mandatory and
sequential.

## Gate 1 — REFERENCE LOCK

Before writing code, declare the **canonical reference** in the plan: the
existing page/consumer the new work must be a diff of (a canonical remote
page for remote work; `user_profiles.meta.ts` for entity meta). Produce
an **anatomy inventory**: `ctx.mount_host` usage, `ctx.notify`, host-
mounted vs remote-owned regions, save/cancel flow, sync-channel contract.
Review the new code as **diff vs inventory** — never vs memory.

## Gate 2 — CONTRACT READ

For every imported `@primebrick/ui` component and every declared contract
(`ModuleEventsDecl`, `FormPageDecl`, `MetaColumn` tooltip fields,
`EntityTablePage.syncChannel`): read the type/docstring **in the file
itself** and cite the constraints that apply. Metadata fields exist
because a host renderer consumes them — declaring a feature without
populating the fields that feed it is a missing feature, not a done one.

## Gate 3 — ALLOCATION CHECK

- Every new i18n key → grep the module's translation namespace; keys live
  in the OWNING module's translations and ship via signed db-meta patches.
- Every new Lucide icon in a remote page → grep usage; imports go through
  `@primebrick/ui/vendor/lucide`.
- Every new entity/meta field → snake_case, entity-shape, `withColumnConstraints`
  coverage where physical.
Attach results to the plan.

## Gate 4 — E2E = PRODUCT CONTRACT

Remote pages assert **platform behavior** in the host: popup open via
`window.opener` contract, `notifyParentAndClose` + BroadcastChannel
refresh of the parent list, fallback navigation when not a child tab.
Never assert the remote's internal shortcut.

## Gate 5 — VISUAL GATE

Before "done": the page rendered inside the real host is the evidence —
not the chunk building cleanly.

## Gate 6 — DONE = SIGNED CHECKLIST

A task closes only when the plan/checklist records: reference named,
anatomy inventory produced, contracts read, allocations checked, contract
E2E, host-rendered evidence.
