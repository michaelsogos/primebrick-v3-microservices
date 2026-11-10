/**
 * Domain contracts persisted as jsonb entity props.
 *
 * Each class is the runtime type of one entity column: the entity declares
 * `@Column({ jsType: <Class> })` and hydration revives the jsonb payload to
 * a real instance — element-wise for array props (`cls.fromJson` when
 * exposed, else prototype graft). Field vocabularies come from real
 * consumers — nothing aspirational.
 */

/**
 * `job_triggers.filter` — one match clause of the event filter (promoted
 * from the ad-hoc type in `triggers-engine.ts`). The engine evaluates
 * `f.field` (dotted path on the event payload) against `f.value` under
 * `f.op` — `eq` (default), `neq`, `exists`, `contains`, `gt`, `lt`.
 */
export class RuleFilter {
  field!: string;
  op?: "eq" | "neq" | "exists" | "contains" | "gt" | "lt";
  value?: unknown;
}
