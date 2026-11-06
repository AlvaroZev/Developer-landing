/**
 * @triunder/industry-registry
 *
 * Register an industry by appending to `industries`. Themes, terminology,
 * and the primary solution live with that entry.
 *
 * Do not branch application code on industry slug except inside a specialized
 * demo. Shared UI should read terminology and tokens from the definition.
 */
import { contrastIssues, tokenKeysComplete } from "@triunder/theme-system";
import { industries } from "./industries.js";
import type { IndustryDefinition } from "./types.js";

export type { IndustryDefinition } from "./types.js";
export { industries };
export {
  getIndustryById,
  getIndustryBySlug,
  industrySupportsSolution,
  listShowroomIndustries,
  requireIndustryBySlug,
  type ShowroomIndustry,
} from "./compat.js";

/** Alias used by the showroom shell — same as listShowroomIndustries. */
export { listShowroomIndustries as listIndustries } from "./compat.js";

export function getIndustry(slug: string): IndustryDefinition | undefined {
  return industries.find((industry) => industry.slug === slug);
}

export function industrySlugs(): string[] {
  return industries.map((industry) => industry.slug);
}

/** Problems a theme would cause for text. Used by the registry test matrix. */
export function industryContrastReport(
  industry: IndustryDefinition,
): { mode: "light" | "dark"; issues: string[] }[] {
  return (["light", "dark"] as const).map((mode) => ({
    mode,
    issues: contrastIssues(industry.theme[mode]).map(
      (issue) => `${issue.pair} ${issue.ratio.toFixed(2)} < ${issue.minimum}`,
    ),
  }));
}

export function industryThemeComplete(industry: IndustryDefinition): boolean {
  return tokenKeysComplete(industry.theme.light) && tokenKeysComplete(industry.theme.dark);
}
