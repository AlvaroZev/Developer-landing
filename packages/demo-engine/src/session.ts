import {
  DEMO_CLOCK,
  type Complexity,
  type DemoState,
  type EntityRecord,
  type EntitySchema,
  type NavItem,
} from '@triunder/domain';
import { getModule, planAddition, type ModuleDefinition } from '@triunder/module-system';
import { getDemo } from './catalog';
import type { DemoDefinition } from './types';

/**
 * Turns a definition plus modules into a serializable session.
 * Module entities are copied in only when the module is actually active,
 * so a URL cannot smuggle an incompatible ledger into the demo.
 */
export interface SessionBuild {
  state: DemoState | null;
  rejectedModules: string[];
  impliedModules: string[];
  error?: 'unsupported';
}

export function createSession(
  industry: string,
  solution: string,
  complexity: Complexity,
  requestedModules: readonly string[] = [],
  clock = DEMO_CLOCK,
): SessionBuild {
  const definition = getDemo(industry, solution);
  if (!definition) return { state: null, rejectedModules: [...requestedModules], impliedModules: [], error: 'unsupported' };
  const { active, rejected, implied } = resolveModules(definition, requestedModules);
  const entities = stampEntities(definition.seed, clock);
  let state: DemoState = {
    version: 1,
    definitionId: definition.id,
    industry,
    solution,
    complexity,
    modules: [],
    entities,
    notifications: [],
    audit: [],
    cart: [],
    seq: 100,
    simulatedRole: complexity === 'enterprise' ? (definition.roles?.[0]?.id ?? null) : null,
    clock,
  };
  for (const moduleId of active) {
    const module = getModule(moduleId);
    if (module) state = attachModule(state, module, clock);
  }
  return { state, rejectedModules: rejected, impliedModules: implied };
}

export function resolveModules(
  definition: DemoDefinition,
  requested: readonly string[],
): { active: string[]; rejected: string[]; implied: string[] } {
  const active: string[] = [];
  const rejected: string[] = [];
  const implied: string[] = [];
  for (const moduleId of requested) {
    if (active.includes(moduleId)) continue;
    const planned = planAddition(active, moduleId, definition.solution, definition.industry, true);
    if (!planned.ok) {
      rejected.push(moduleId);
      continue;
    }
    for (const id of planned.activate) {
      if (!requested.includes(id) && !implied.includes(id)) implied.push(id);
      if (!active.includes(id)) active.push(id);
    }
  }
  return { active, rejected, implied };
}

export function attachModule(state: DemoState, module: ModuleDefinition, clock = state.clock): DemoState {
  const entities = { ...state.entities };
  const products = entities.products;
  if (module.id === 'inventory' && products && products.length > 0) {
    entities.stock_items = products.map((product) => ({
      id: `stk-${product.id}`,
      sku: String(product.sku ?? product.id),
      name: String(product.name ?? product.sku ?? 'Item'),
      onHand: Number(product.stock ?? 0),
      status: 'available',
      createdAt: clock,
      updatedAt: clock,
    }));
    entities.stock_moves = entities.stock_moves ?? [];
  }
  for (const [key, rows] of Object.entries(module.seed)) {
    if (!entities[key]) {
      entities[key] = rows.map((row) => stamp(row, clock));
    }
  }
  return {
    ...state,
    entities,
    modules: state.modules.includes(module.id) ? state.modules : [...state.modules, module.id],
  };
}

export function detachModule(state: DemoState, moduleId: string): DemoState {
  const module = getModule(moduleId);
  const entities = { ...state.entities };
  if (module) {
    for (const schema of module.entities) {
      delete entities[schema.key];
    }
  }
  return { ...state, entities, modules: state.modules.filter((id) => id !== moduleId) };
}

export function schemasFor(definition: DemoDefinition, modules: readonly string[]): EntitySchema[] {
  const schemas = [...definition.entities];
  const keys = new Set(schemas.map((schema) => schema.key));
  for (const moduleId of modules) {
    const module = getModule(moduleId);
    if (!module) continue;
    for (const schema of module.entities) {
      if (!keys.has(schema.key)) {
        schemas.push(schema);
        keys.add(schema.key);
      }
    }
  }
  return schemas;
}

export function navigationFor(definition: DemoDefinition, modules: readonly string[], complexity: Complexity): NavItem[] {
  const items = [...definition.navigation];
  const ids = new Set(items.map((item) => item.id));
  for (const moduleId of modules) {
    const module = getModule(moduleId);
    if (!module) continue;
    for (const item of module.navigation) {
      if (!ids.has(item.id)) {
        items.push(item);
        ids.add(item.id);
      }
    }
  }
  return items.filter((item) => {
    if (!item.minComplexity) return true;
    const rank = { starter: 0, professional: 1, enterprise: 2 };
    return rank[complexity] >= rank[item.minComplexity];
  });
}

function stampEntities(seed: Record<string, Record<string, unknown>[]>, clock: string): Record<string, EntityRecord[]> {
  const entities: Record<string, EntityRecord[]> = {};
  for (const [key, rows] of Object.entries(seed)) {
    entities[key] = rows.map((row) => stamp(row, clock));
  }
  return entities;
}

function stamp(row: Record<string, unknown>, clock: string): EntityRecord {
  return {
    ...row,
    id: String(row.id ?? ''),
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : clock,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : clock,
  };
}

export function definitionFor(state: DemoState): DemoDefinition | undefined {
  return getDemo(state.industry, state.solution);
}

/**
 * Restores a saved demonstration only when it belongs to the same industry
 * and solution. A corrupt payload falls back to a fresh Harborline seed
 * rather than throwing into the UI.
 */
export function restoreSession(
  raw: unknown,
  industry: string,
  solution: string,
  complexity: Complexity,
  requestedModules: readonly string[] = [],
): SessionBuild {
  const fresh = createSession(industry, solution, complexity, requestedModules);
  if (!fresh.state || !isDemoState(raw)) return fresh;
  if (raw.industry !== industry || raw.solution !== solution || raw.definitionId !== fresh.state.definitionId) {
    return fresh;
  }
  const simulatedRole = complexity === 'enterprise' ? (raw.simulatedRole ?? fresh.state.simulatedRole) : null;
  return {
    state: { ...raw, complexity, simulatedRole, version: 1 },
    rejectedModules: [],
    impliedModules: [],
  };
}

function isDemoState(raw: unknown): raw is DemoState {
  if (!raw || typeof raw !== 'object') return false;
  const value = raw as Partial<DemoState>;
  return value.version === 1 && typeof value.industry === 'string' && typeof value.entities === 'object' && value.entities !== null;
}
