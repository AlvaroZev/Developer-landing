import { compatibility, solutions } from "./catalog";
import type { SolutionDefinition } from "./types";

export { compatibility, solutions } from "./catalog";
export {
  solutionCategories,
  type CompatibilityMatrix,
  type LocaleCopy,
  type SolutionCategory,
  type SolutionDefinition,
} from "./types";

const bySlug = new Map(solutions.map((solution) => [solution.slug, solution]));

export function getSolution(slug: string): SolutionDefinition | undefined {
  return bySlug.get(slug);
}

export function solutionsForIndustry(industrySlug: string): SolutionDefinition[] {
  const slugs = compatibility[industrySlug] ?? [];
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((item): item is SolutionDefinition => Boolean(item));
}

export function isCompatible(industrySlug: string, solutionSlug: string): boolean {
  return (compatibility[industrySlug] ?? []).includes(solutionSlug);
}

export function allCompatiblePairs(): { industry: string; solution: string }[] {
  return Object.entries(compatibility).flatMap(([industry, solutionSlugs]) =>
    solutionSlugs.map((solution) => ({ industry, solution })),
  );
}

export function demoPath(industrySlug: string, solutionSlug: string): string {
  return `/explore/${industrySlug}/${solutionSlug}`;
}
