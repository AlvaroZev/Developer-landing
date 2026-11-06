/**
 * Live demonstrations. This array — not a hand-maintained test list — is the
 * compatibility matrix. A solution can appear in the catalog without a demo;
 * it must not be offered as an application unless it is here.
 */
import { getSolutionById, getSolutionBySlug } from '@triunder/solution-registry';
import { flagshipDemos } from './flagship';
import { registryDemos } from './registry-demos';
import type { DemoDefinition } from './types';

export const demos: readonly DemoDefinition[] = [...flagshipDemos, ...registryDemos];

export function listDemos(): readonly DemoDefinition[] {
  return demos;
}

/**
 * Resolves either a catalog id (`fleet-management`) or a URL slug (`fleet`).
 * The showroom links use slugs; industry.primarySolution stores ids.
 */
export function getDemo(industry: string, solution: string): DemoDefinition | undefined {
  const wanted = new Set<string>([solution]);
  const bySlug = getSolutionBySlug(solution);
  const byId = getSolutionById(solution);
  if (bySlug) {
    wanted.add(bySlug.id);
    wanted.add(bySlug.slug);
  }
  if (byId) {
    wanted.add(byId.id);
    wanted.add(byId.slug);
  }
  return demos.find((demo) => demo.industry === industry && wanted.has(demo.solution));
}

export function getDemoById(id: string): DemoDefinition | undefined {
  return demos.find((demo) => demo.id === id);
}
