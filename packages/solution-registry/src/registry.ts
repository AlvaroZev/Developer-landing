import { getIndustry } from "@triunder/industry-registry";
import { SOLUTIONS } from "./definitions.js";
import type { SolutionDefinition } from "./types.js";

const byId = new Map(SOLUTIONS.map((s) => [s.id, s]));
const bySlug = new Map(SOLUTIONS.map((s) => [s.slug, s]));

export function listSolutions(): readonly SolutionDefinition[] {
  return SOLUTIONS;
}

export function getSolutionById(id: string): SolutionDefinition | undefined {
  return byId.get(id);
}

export function getSolutionBySlug(slug: string): SolutionDefinition | undefined {
  return bySlug.get(slug);
}

export function requireSolutionBySlug(slug: string): SolutionDefinition {
  const solution = bySlug.get(slug);
  if (!solution) throw new Error(`Unknown solution slug: ${slug}`);
  return solution;
}

/**
 * Compatible when the solution lists the industry AND the industry's
 * primary solution matches (or the solution is an intentional extra).
 */
export function isCompatible(industryId: string, solutionId: string): boolean {
  const industry = getIndustry(industryId);
  const solution = byId.get(solutionId);
  if (!industry || !solution) return false;
  if (!solution.compatibleIndustryIds.includes(industryId)) return false;
  // A live pairing is the industry's primary solution. Catalog relevance is wider
  // and must not be presented as an implemented demonstration.
  return industry.primarySolution === solution.id;
}

export function listCompatibleSolutions(industryId: string): SolutionDefinition[] {
  return SOLUTIONS.filter((s) => isCompatible(industryId, s.id));
}

export function listCompatiblePairs(): Array<{
  industryId: string;
  solutionId: string;
  industrySlug: string;
  solutionSlug: string;
  demoTemplateId: string;
}> {
  const pairs: Array<{
    industryId: string;
    solutionId: string;
    industrySlug: string;
    solutionSlug: string;
    demoTemplateId: string;
  }> = [];
  for (const solution of SOLUTIONS) {
    for (const industryId of solution.compatibleIndustryIds) {
      if (!isCompatible(industryId, solution.id)) continue;
      const industry = getIndustry(industryId);
      if (!industry) continue;
      pairs.push({
        industryId,
        solutionId: solution.id,
        industrySlug: industry.slug,
        solutionSlug: solution.slug,
        demoTemplateId: solution.demoTemplateId,
      });
    }
  }
  return pairs;
}

export const COMPLETE_DEMO_TEMPLATE_IDS = [
  "crm",
  "ecommerce",
  "mes",
  "fleet",
  "agriculture-iot",
] as const;

export function isCompleteDemo(demoTemplateId: string): boolean {
  if ((COMPLETE_DEMO_TEMPLATE_IDS as readonly string[]).includes(demoTemplateId)) return true;
  return SOLUTIONS.some(
    (solution) =>
      solution.complete === true &&
      (solution.demoTemplateId === demoTemplateId || solution.id === demoTemplateId || solution.slug === demoTemplateId),
  );
}
