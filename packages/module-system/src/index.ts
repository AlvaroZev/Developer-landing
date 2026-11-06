/**
 * @triunder/module-system
 *
 * Compatibility and dependency rules for optional demonstration slices.
 * The demo engine calls `planAddition` and `planRemoval` before it mutates
 * state, so a module cannot appear just because the UI offered a button.
 */
import type { ModuleDefinition, ModuleRefusal, RemovalPlan } from './types';
import { modules } from './registry';

export type { ModuleDefinition, ModuleRefusal, RemovalPlan } from './types';
export { modules };

export function listModules(): readonly ModuleDefinition[] {
  return modules;
}

export function getModule(id: string): ModuleDefinition | undefined {
  return modules.find((module) => module.id === id);
}

export function moduleCompatible(module: ModuleDefinition, solution: string, industry: string): boolean {
  if (!module.compatibleSolutions.includes(solution)) return false;
  if (module.compatibleIndustries.length > 0 && !module.compatibleIndustries.includes(industry)) return false;
  return true;
}

export function planAddition(
  active: readonly string[],
  moduleId: string,
  solution: string,
  industry: string,
  withDependencies = false,
): ModuleRefusal {
  const module = getModule(moduleId);
  if (!module) return { ok: false, code: 'unknown' };
  if (!moduleCompatible(module, solution, industry)) return { ok: false, code: 'incompatible' };
  for (const conflict of module.conflicts) {
    if (active.includes(conflict)) return { ok: false, code: 'conflict', moduleId: conflict };
  }
  const missing = module.dependencies.filter((dependency) => !active.includes(dependency) && dependency !== moduleId);
  if (missing.length > 0 && !withDependencies) {
    return { ok: false, code: 'dependency', moduleId: missing[0] };
  }
  const activate: string[] = [];
  if (withDependencies) {
    for (const dependency of missing) {
      const planned = planAddition(active.concat(activate), dependency, solution, industry, true);
      if (!planned.ok) return planned;
      for (const id of planned.activate) {
        if (!activate.includes(id)) activate.push(id);
      }
    }
  }
  if (!active.includes(moduleId) && !activate.includes(moduleId)) activate.push(moduleId);
  return { ok: true, activate };
}

export function planRemoval(active: readonly string[], moduleId: string, force = false): RemovalPlan {
  if (!getModule(moduleId)) return { ok: false, code: 'unknown' };
  if (!active.includes(moduleId)) return { ok: false, code: 'absent' };
  const dependents = active.filter((id) => getModule(id)?.dependencies.includes(moduleId));
  if (dependents.length > 0 && !force) return { ok: false, code: 'dependents', dependents };
  const remove = new Set<string>([moduleId]);
  if (force) {
    for (const dependent of dependents) remove.add(dependent);
  }
  return { ok: true, remove: [...remove] };
}
