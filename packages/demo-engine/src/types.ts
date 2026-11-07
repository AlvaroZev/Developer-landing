/**
 * Demo engine contracts.
 *
 * A blueprint is the solution's domain: entities, status graph, and the
 * presentation the shell should use. An industry resolves a blueprint with
 * its own theme, vocabulary, extra fields, and seeded rows.
 *
 * Do not add a visitor-facing complexity tier or a way to compose two
 * solutions. One route is one application.
 */
export interface Copy {
  en: string;
  es: string;
}

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "money"
  | "percent"
  | "date"
  | "email"
  | "select"
  | "status"
  | "boolean"
  | "relation";

export interface OptionDef {
  value: string;
  label: Copy;
}

export interface FieldDef {
  key: string;
  label: Copy;
  type: FieldType;
  required?: boolean;
  options?: OptionDef[];
  relation?: string;
  min?: number;
  max?: number;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  table?: boolean;
  form?: boolean;
  readonly?: boolean;
}

export interface EntityDef {
  key: string;
  singular: Copy;
  plural: Copy;
  fields: FieldDef[];
  statusKey?: string;
  transitions?: Record<string, string[]>;
}

export type Presentation =
  | "pipeline"
  | "ledger"
  | "commerce"
  | "operations"
  | "calendar"
  | "telemetry"
  | "documents"
  | "analytics"
  | "control"
  | "knowledge";

export type WidgetKind = "count" | "sum" | "avg" | "bar" | "donut" | "table" | "alerts";

export interface WidgetDef {
  id: string;
  kind: WidgetKind;
  title: Copy;
  entity: string;
  field?: string;
  equals?: string;
  groupBy?: string;
}

export interface HardwareSpec {
  kind:
    | "iot"
    | "robotics"
    | "agriculture"
    | "embedded"
    | "energy"
    | "automation"
    | "control"
    | "telemetry"
    | "sensor"
    | "integration";
  deviceEntity: string;
  readingField: string;
  thresholdField?: string;
  estop?: boolean;
}

export interface OrderSpec {
  productEntity: string;
  orderEntity: string;
  stockField: string;
  priceField: string;
}

export interface CalendarSpec {
  entity: string;
  resourceField: string;
  startField: string;
  endField: string;
}

export interface KnowledgeSpec {
  entity: string;
  titleField: string;
  bodyField: string;
}

export interface ExtractSpec {
  entity: string;
  bodyField: string;
}

export interface Blueprint {
  slug: string;
  presentation: Presentation;
  entities: EntityDef[];
  dashboard: WidgetDef[];
  hardware?: HardwareSpec;
  order?: OrderSpec;
  calendar?: CalendarSpec;
  knowledge?: KnowledgeSpec;
  extract?: ExtractSpec;
}

export interface Row {
  id: string;
  [key: string]: unknown;
}

export interface Notice {
  id: string;
  tone: "info" | "success" | "warning";
  title: string;
  body: string;
}

export interface KnowledgeHit {
  id: string;
  title: string;
  excerpt: string;
  score: number;
}

export interface DemoState {
  entities: Record<string, Row[]>;
  notices: Notice[];
  seq: number;
  clock: string;
  ticks: number;
  knowledge: KnowledgeHit[];
}

export type DemoAction =
  | { type: "create"; entity: string; values: Record<string, unknown> }
  | { type: "update"; entity: string; id: string; values: Record<string, unknown> }
  | { type: "delete"; entity: string; id: string }
  | { type: "transition"; entity: string; id: string; to: string }
  | { type: "simulate"; id?: string }
  | { type: "control"; entity: string; id: string; control: string; value?: unknown }
  | { type: "compose-order"; lines: { productId: string; qty: number }[]; customerId?: string }
  | { type: "query-knowledge"; query: string }
  | { type: "extract"; id: string }
  | { type: "reset" };

export interface DemoError {
  code: string;
  message: string;
  field?: string;
}

export interface ReduceResult {
  state: DemoState;
  ok: boolean;
  error?: DemoError;
}

export interface ResolvedDemo {
  id: string;
  industrySlug: string;
  solutionSlug: string;
  blueprint: Blueprint;
  entities: EntityDef[];
  dashboard: WidgetDef[];
  seeds: Record<string, Row[]>;
  currency: string;
  taxRate: number;
  presentation: Presentation;
}
