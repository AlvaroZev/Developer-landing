import { exerciseDemo, integrityIssues, resolveDemo } from "@triunder/demo-engine";
import { industries } from "@triunder/industry-registry";
import { allCompatiblePairs, solutions } from "@triunder/solution-registry";

/**
 * @triunder/test-utils
 *
 * Shared catalog assertions. End-to-end and package tests should call these
 * instead of keeping a second copy of the industry list.
 */
export interface CatalogReport {
  industries: number;
  solutions: number;
  pairs: number;
  failures: string[];
}

export function runCatalogReport(): CatalogReport {
  const failures: string[] = [];
  if (industries.length !== 20) failures.push("industry count");
  if (solutions.length !== 51) failures.push("solution count");
  for (const pair of allCompatiblePairs()) {
    const demo = resolveDemo(pair.industry, pair.solution);
    if (!demo) {
      failures.push(`missing ${pair.industry}/${pair.solution}`);
      continue;
    }
    const issues = integrityIssues(demo);
    if (issues.length) failures.push(issues[0] ?? "integrity");
    const result = exerciseDemo(demo);
    if (!result.ok) failures.push(`${pair.industry}/${pair.solution} ${result.reason ?? "failed"}`);
  }
  return {
    industries: industries.length,
    solutions: solutions.length,
    pairs: allCompatiblePairs().length,
    failures,
  };
}
