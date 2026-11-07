/**
 * Solution metadata and the compatibility matrix.
 *
 * This package is the source of truth for WHICH solutions exist and WHICH
 * industries they belong to. It does not implement screens.
 * Implementations live in `@triunder/demo-engine` and must cover every slug
 * listed here. Unsupported pairs must be absent from `compatibility`.
 */
export const solutionCategories = [
  "business",
  "commerce",
  "operations",
  "intelligence",
  "hardware",
] as const;

export type SolutionCategory = (typeof solutionCategories)[number];

export interface LocaleCopy {
  en: string;
  es: string;
}

export interface SolutionDefinition {
  slug: string;
  category: SolutionCategory;
  name: LocaleCopy;
  description: LocaleCopy;
  integrations: string[];
  workflows: LocaleCopy[];
}

export type CompatibilityMatrix = Record<string, readonly string[]>;
