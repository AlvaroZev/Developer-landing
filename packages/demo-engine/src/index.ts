/**
 * @triunder/demo-engine
 *
 * Framework-free runtime for every showroom demonstration.
 *
 * Extension points:
 * - Add a solution in `src/blueprints/<category>.ts`.
 * - Add industry vocabulary in `src/vocabulary.ts`.
 * - Add a domain effect in `src/reduce.ts` under the solution slug.
 * - Do not build a second application shell per industry. The web app renders
 *   `presentation` and the entity list.
 *
 * `resolveDemo` returns null when the compatibility matrix does not allow the
 * pair. That is intentional.
 */
export { blueprints, getBlueprint } from "./blueprints";
export { L } from "./dsl";
export { exerciseDemo } from "./exercise";
export { queryRows, rowLabel, widgetNumber, widgetSlices } from "./query";
export { initialState, labelForRow, reduceDemo } from "./reduce";
export { integrityIssues, resolveDemo } from "./resolve";
export type {
  Blueprint,
  Copy,
  DemoAction,
  DemoState,
  EntityDef,
  FieldDef,
  HardwareSpec,
  KnowledgeHit,
  Notice,
  Presentation,
  ResolvedDemo,
  Row,
  WidgetDef,
} from "./types";

export function localize(copy: { en: string; es: string }, locale: "en" | "es"): string {
  return copy[locale];
}
