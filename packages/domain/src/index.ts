/**
 * @triunder/domain
 *
 * Shared vocabulary for the showroom. This package holds types and pure
 * constants only — no React, no database, no industry-specific behavior.
 *
 * Extend a concept here when both the registries and the demo engine need
 * the same shape. Keep business rules in @triunder/demo-engine.
 */

export type Locale = 'en' | 'es';

export interface LocaleText {
  en: string;
  es: string;
}

export type Complexity = 'starter' | 'professional' | 'enterprise';

export const COMPLEXITY_LEVELS: readonly Complexity[] = [
  'starter',
  'professional',
  'enterprise',
] as const;

/** Ordered requirement sections. The Go API duplicates this list; keep both in sync. */
export const REQUIREMENT_SECTION_KEYS = [
  'business_context',
  'problem_statement',
  'objectives',
  'proposed_solution',
  'selected_modules',
  'functional_requirements',
  'non_functional_requirements',
  'user_roles',
  'main_workflows',
  'data_entities',
  'required_integrations',
  'hardware_requirements',
  'technical_considerations',
  'assumptions',
  'open_questions',
  'recommended_next_steps',
] as const;

export type RequirementSectionKey = (typeof REQUIREMENT_SECTION_KEYS)[number];

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'date'
  | 'currency'
  | 'status';

export interface FieldOption {
  value: string;
  label: LocaleText;
}

export interface FieldDef {
  key: string;
  type: FieldType;
  label: LocaleText;
  required?: boolean;
  options?: FieldOption[];
  min?: number;
  max?: number;
  filterable?: boolean;
  sortable?: boolean;
  table?: boolean;
  form?: boolean;
}

export interface EntitySchema {
  key: string;
  singular: LocaleText;
  plural: LocaleText;
  /** Field shown as the record title. */
  primary: string;
  search: string[];
  fields: FieldDef[];
  /** Status field used by board views, when the entity has a pipeline. */
  statusField?: string;
}

export interface NavItem {
  id: string;
  label: LocaleText;
  icon: string;
  view: 'dashboard' | 'entity' | 'board' | 'custom';
  entityKey?: string;
  custom?: string;
  minComplexity?: Complexity;
  /** Set when the item is contributed by a module. */
  moduleId?: string;
}

export interface MetricDef {
  id: string;
  label: LocaleText;
  minComplexity?: Complexity;
  kind: 'count' | 'countWhere' | 'sum';
  entity: string;
  field?: string;
  equals?: string;
  format?: 'number' | 'currency';
}

export interface ChartPoint {
  label: LocaleText;
  value: number;
}

export interface ChartDef {
  id: string;
  label: LocaleText;
  minComplexity?: Complexity;
  points: ChartPoint[];
}

export interface SimulatedRole {
  id: string;
  label: LocaleText;
  /** Action names, or '*' for every action. */
  allow: string[];
}

export type NotificationTone = 'info' | 'warning' | 'critical';

export interface DemoNotification {
  id: string;
  tone: NotificationTone;
  title: LocaleText;
  body: LocaleText;
  at: string;
  read: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  action: string;
  summary: LocaleText;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface EntityRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

/**
 * Serializable demonstration state. Persisted for guests and accounts.
 * `seq` makes generated ids deterministic for a given history.
 */
export interface DemoState {
  version: 1;
  definitionId: string;
  industry: string;
  solution: string;
  complexity: Complexity;
  modules: string[];
  entities: Record<string, EntityRecord[]>;
  notifications: DemoNotification[];
  audit: AuditEntry[];
  cart: CartLine[];
  seq: number;
  simulatedRole: string | null;
  clock: string;
}

export interface DomainEvent {
  type: string;
  at: string;
  payload: Record<string, unknown>;
}

export type DemoAction =
  | { type: 'create'; entity: string; data: Record<string, unknown> }
  | { type: 'update'; entity: string; id: string; data: Record<string, unknown> }
  | { type: 'remove'; entity: string; id: string }
  | { type: 'set_status'; entity: string; id: string; status: string }
  | { type: 'add_module'; moduleId: string; withDependencies?: boolean }
  | { type: 'remove_module'; moduleId: string; force?: boolean }
  | { type: 'set_role'; roleId: string }
  | { type: 'set_complexity'; complexity: Complexity }
  | { type: 'mark_notifications_read' }
  | { type: 'cart_add'; productId: string; quantity: number }
  | { type: 'cart_set_qty'; productId: string; quantity: number }
  | { type: 'checkout'; customerName: string }
  | { type: 'special'; name: string; payload: Record<string, unknown> };

export interface ActionError {
  code: string;
  field?: string;
  message: LocaleText;
}

export function text(en: string, es: string): LocaleText {
  return { en, es };
}

export function readLocale(value: LocaleText | undefined, locale: Locale): string {
  if (!value) return '';
  return value[locale] || value.en;
}

export function complexityRank(level: Complexity): number {
  if (level === 'starter') return 0;
  if (level === 'professional') return 1;
  return 2;
}

export function meetsComplexity(current: Complexity, minimum?: Complexity): boolean {
  if (!minimum) return true;
  return complexityRank(current) >= complexityRank(minimum);
}

export const DEMO_CLOCK = '2026-04-12T15:00:00.000Z';

export const ANALYTICS_EVENTS = [
  'page_view',
  'industry_selected',
  'solution_selected',
  'complexity_selected',
  'module_added',
  'module_removed',
  'demo_started',
  'demo_interaction',
  'configuration_saved',
  'configuration_shared',
  'requirements_started',
  'requirements_generated',
  'requirements_edited',
  'requirements_approved',
  'account_registered',
  'project_inquiry_submitted',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export const PROJECT_STATUSES = [
  'draft',
  'exploring',
  'requirements_in_progress',
  'submitted',
  'in_discussion',
  'completed',
  'archived',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const AI_FEATURE_KEYS = ['requirements', 'assistant', 'scope'] as const;
export type AiFeatureKey = (typeof AI_FEATURE_KEYS)[number];

export {
  COMPLEXITY_PROFILES,
  meetsComplexityLegacy,
  type ColorMode,
  type ComplexityLevel,
  type ProjectConfiguration,
  type TerminologyDictionary,
} from "./compat.js";
