import { type IndustryDefinition, industries } from "./industries";

/**
 * @triunder/industry-registry
 *
 * Source of truth for industry identity, theme attachment, flavor, and the
 * homepage stories. Solution compatibility is owned by the solution registry
 * and attached here so callers do not rejoin the two catalogs themselves.
 */
export {
  capabilities,
  caseStudies,
  defaultFeatured,
  processSteps,
  spotlightIndustries,
} from "./content";
export {
  industries,
  type IndustryDefinition,
  type IndustryFlavor,
  type LocaleCopy,
} from "./industries";

const bySlug = new Map(industries.map((industry) => [industry.slug, industry]));

export function getIndustry(slug: string): IndustryDefinition | undefined {
  return bySlug.get(slug);
}

export function industrySlugs(): string[] {
  return industries.map((industry) => industry.slug);
}
