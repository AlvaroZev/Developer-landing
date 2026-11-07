import { compatibility, solutions } from "@triunder/solution-registry";
import { industryThemes } from "@triunder/theme-system";
import { describe, expect, it } from "vitest";
import apiCatalog from "../../../apps/api/internal/catalog/catalog.json";
import { caseStudies, defaultFeatured, getIndustry, industries } from "./index";

describe("industry registry", () => {
  it("registers the full industry list with themes and both languages", () => {
    expect(industries).toHaveLength(20);
    const slugs = industries.map((industry) => industry.slug);
    expect(new Set(slugs).size).toBe(20);
    for (const industry of industries) {
      expect(industry.name.en.length).toBeGreaterThan(2);
      expect(industry.name.es.length).toBeGreaterThan(2);
      expect(industry.description.es.length).toBeGreaterThan(20);
      expect(industry.theme.light.background).toMatch(/^#/);
      expect(industry.theme.dark.text).toMatch(/^#/);
      expect(industryThemes[industry.slug]).toBeDefined();
      expect(industry.solutionSlugs).toEqual(compatibility[industry.slug]);
      expect(industry.flavor.people.length).toBeGreaterThan(0);
    }
  });

  it("gives every industry except custom at least one solution", () => {
    for (const industry of industries) {
      if (industry.slug === "custom") expect(industry.solutionSlugs).toEqual([]);
      else expect(industry.solutionSlugs.length).toBeGreaterThan(0);
    }
  });

  it("points featured work at real pairs", () => {
    expect(apiCatalog.featured).toEqual(defaultFeatured);
    expect(apiCatalog.industries).toEqual(industries.map((industry) => industry.slug));
    for (const item of defaultFeatured) {
      const industry = getIndustry(item.industry);
      expect(industry?.solutionSlugs).toContain(item.solution);
    }
    for (const study of caseStudies) {
      expect(getIndustry(study.industry)?.solutionSlugs).toContain(study.solution);
      expect(study.summary.es.length).toBeGreaterThan(40);
    }
  });

  it("does not leave a registered solution without an industry", () => {
    const used = new Set(industries.flatMap((industry) => industry.solutionSlugs));
    for (const solution of solutions) expect(used.has(solution.slug)).toBe(true);
  });
});
