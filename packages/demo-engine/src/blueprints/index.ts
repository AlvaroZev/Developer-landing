import type { Blueprint } from "../types";
import { businessBlueprints } from "./business";
import { commerceBlueprints } from "./commerce";
import { hardwareBlueprints } from "./hardware";
import { intelligenceBlueprints } from "./intelligence";
import { operationsBlueprints } from "./operations";

/**
 * Every solution slug has exactly one blueprint. Industry differences are
 * applied later, in `resolve.ts`. Add a solution here and in the solution
 * registry together — the engine tests fail if either side is missing.
 */
export const blueprints: readonly Blueprint[] = [
  ...businessBlueprints,
  ...commerceBlueprints,
  ...operationsBlueprints,
  ...intelligenceBlueprints,
  ...hardwareBlueprints,
];

const bySlug = new Map(blueprints.map((blueprint) => [blueprint.slug, blueprint]));

export function getBlueprint(slug: string): Blueprint | undefined {
  return bySlug.get(slug);
}
