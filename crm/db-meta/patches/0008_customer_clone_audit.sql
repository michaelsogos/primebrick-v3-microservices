-- customer clone-audit pair: `Clonable` mixin completes the clone
-- vocabulary on crm.customers — cloned_from (uuid, already shipped) is
-- joined by cloned_at / cloned_by. Both are immutable clone-write-path
-- stamps: populated once by the clone operation, never user-editable.
-- cloned_by mirrors the audit-actor contract (`created_by`/`updated_by`):
-- text, may hold pseudo-actors (`system`), resolved to user_profile in
-- the served meta.

ALTER TABLE crm.customers
  ADD COLUMN cloned_at timestamptz,
  ADD COLUMN cloned_by text;
