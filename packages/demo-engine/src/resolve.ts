import { getIndustry } from "@triunder/industry-registry";
import { isCompatible } from "@triunder/solution-registry";
import { getBlueprint } from "./blueprints";
import { finalizeSeed, seedEntities } from "./seed";
import type { EntityDef, ResolvedDemo } from "./types";
import { fieldExtensions, labelOverrides, termOverrides } from "./vocabulary";

/**
 * Resolves one showroom application.
 * Returns null for pairs that are not in the compatibility matrix, including
 * a direct URL to an unsupported combination. Callers show the unavailable
 * state instead of rendering a generic demo.
 */
export function resolveDemo(industrySlug: string, solutionSlug: string): ResolvedDemo | null {
  if (!isCompatible(industrySlug, solutionSlug)) return null;
  const industry = getIndustry(industrySlug);
  const blueprint = getBlueprint(solutionSlug);
  if (!industry || !blueprint) return null;

  const entities = structuredClone(blueprint.entities) as EntityDef[];
  for (const extra of fieldExtensions[industrySlug]?.[solutionSlug] ?? []) {
    const entity = entities.find((item) => item.key === extra.entity);
    if (!entity) continue;
    for (const field of extra.fields) {
      if (!entity.fields.some((item) => item.key === field.key))
        entity.fields.push(structuredClone(field));
    }
  }
  for (const entity of entities) {
    const term = termOverrides[industrySlug]?.[solutionSlug]?.[entity.key];
    if (term) {
      entity.singular = term.singular;
      entity.plural = term.plural;
    }
    for (const field of entity.fields) {
      const label = labelOverrides[industrySlug]?.[solutionSlug]?.[`${entity.key}.${field.key}`];
      if (label) field.label = label;
    }
  }

  return {
    id: `${industrySlug}:${solutionSlug}`,
    industrySlug,
    solutionSlug,
    blueprint,
    entities,
    dashboard: blueprint.dashboard,
    seeds: finalizeSeed(
      solutionSlug,
      entities,
      seedEntities(entities, industry.flavor, industry.slug),
    ),
    currency: industry.flavor.currency,
    taxRate: industry.flavor.taxRate,
    presentation: blueprint.presentation,
  };
}

export function integrityIssues(demo: ResolvedDemo): string[] {
  const issues: string[] = [];
  for (const entity of demo.entities) {
    for (const row of demo.seeds[entity.key] ?? []) {
      for (const field of entity.fields) {
        const value = row[field.key];
        if (field.type === "relation" && value) {
          const target = demo.seeds[field.relation ?? ""] ?? [];
          if (!target.some((item) => item.id === value))
            issues.push(`${demo.id} ${entity.key}.${field.key}`);
        }
        if (
          (field.type === "status" || field.type === "select") &&
          field.options &&
          !field.options.some((option) => option.value === value)
        ) {
          issues.push(`${demo.id} bad ${entity.key}.${field.key}`);
        }
        if (typeof value === "number") {
          if (field.min !== undefined && value < field.min)
            issues.push(`${demo.id} min ${entity.key}.${field.key}`);
          if (field.max !== undefined && value > field.max)
            issues.push(`${demo.id} max ${entity.key}.${field.key}`);
        }
      }
    }
  }
  return issues;
}
