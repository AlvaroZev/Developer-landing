import type {
  ChartDef,
  Complexity,
  EntitySchema,
  LocaleText,
  MetricDef,
  NavItem,
  SimulatedRole,
} from '@triunder/domain';

/**
 * A demo definition is the operable form of an industry/solution pair.
 * If a pair has no definition, the showroom must not present it as a live
 * application. Catalog relevance lives in the solution registry instead.
 *
 * `engine` selects specialized behavior. `generic` still supports create,
 * update, search, and status changes through the shared reducer.
 */
export type DemoEngineName =
  | 'generic'
  | 'healthcare'
  | 'retail'
  | 'manufacturing'
  | 'logistics'
  | 'realestate'
  | 'agriculture'
  | 'booking'
  | 'telemetry';

export interface CapacityHint {
  entity: string;
}

export interface TelemetryHint {
  entity: string;
  valueField: string;
  thresholdField: string;
  direction: 'above' | 'below';
  metric: string;
}

export interface DemoDefinition {
  id: string;
  industry: string;
  solution: string;
  engine: DemoEngineName;
  summary: LocaleText;
  navigation: NavItem[];
  entities: EntitySchema[];
  metrics: MetricDef[];
  charts: ChartDef[];
  seed: Record<string, Record<string, unknown>[]>;
  workflows: LocaleText[];
  optionalModules: string[];
  roles?: SimulatedRole[];
  /** Booking demos decrement `remaining` on this entity. */
  capacity?: CapacityHint;
  /** Telemetry demos step this measurement by a fixed demonstration amount. */
  telemetry?: TelemetryHint;
}
