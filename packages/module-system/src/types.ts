import type { EntitySchema, LocaleText, NavItem } from '@triunder/domain';

/**
 * A module is an optional slice of a demonstration. It contributes entities,
 * navigation, and events. It does not know which React screen draws it.
 *
 * Cross-module effects live in @triunder/demo-engine and listen for the
 * event names declared here. If you add an event, handle it there and test it.
 */
export interface ModuleDefinition {
  id: string;
  name: LocaleText;
  description: LocaleText;
  compatibleSolutions: string[];
  /** Empty means every industry whose solution already allows the module. */
  compatibleIndustries: string[];
  dependencies: string[];
  conflicts: string[];
  entities: EntitySchema[];
  navigation: NavItem[];
  /** Rows are stamped with ids and timestamps when the module is attached. */
  seed: Record<string, Record<string, unknown>[]>;
  listens: string[];
  emits: string[];
}

export type ModuleRefusal =
  | { ok: false; code: 'unknown' | 'incompatible' | 'conflict' | 'dependency'; moduleId?: string }
  | { ok: true; activate: string[] };

export type RemovalPlan =
  | { ok: false; code: 'unknown' | 'absent' | 'dependents'; dependents?: string[] }
  | { ok: true; remove: string[] };
