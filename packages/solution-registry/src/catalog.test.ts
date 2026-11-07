import { describe, expect, it } from "vitest";
import apiCatalog from "../../../apps/api/internal/catalog/catalog.json";
import { allCompatiblePairs, compatibility, getSolution, isCompatible, solutions } from "./index";

describe("solution registry", () => {
  it("gives every solution a unique slug, category, and both languages", () => {
    const slugs = solutions.map((solution) => solution.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(solutions).toHaveLength(51);
    for (const solution of solutions) {
      expect(solution.name.en.length).toBeGreaterThan(2);
      expect(solution.name.es.length).toBeGreaterThan(2);
      expect(solution.description.en.length).toBeGreaterThan(20);
      expect(solution.description.es.length).toBeGreaterThan(20);
      expect(solution.workflows.length).toBeGreaterThan(0);
      expect(solution.integrations.length).toBeGreaterThan(0);
    }
  });

  it("places every solution in at least one industry and never invents a slug", () => {
    const used = new Set(Object.values(compatibility).flat());
    for (const solution of solutions) expect(used.has(solution.slug), solution.slug).toBe(true);
    for (const slug of used) expect(getSolution(slug), slug).toBeDefined();
  });

  it("keeps custom industry free of demonstrations", () => {
    expect(compatibility.custom).toEqual([]);
    expect(isCompatible("healthcare", "robotics")).toBe(false);
    expect(isCompatible("manufacturing", "robotics")).toBe(true);
    expect(allCompatiblePairs().length).toBeGreaterThan(100);
  });

  it("matches the catalog JSON the API enforces", () => {
    expect(apiCatalog.solutions).toEqual(solutions.map((solution) => solution.slug));
    expect(apiCatalog.compatibility).toEqual(compatibility);
  });

  it("does not repeat a solution inside one industry", () => {
    for (const [industry, slugs] of Object.entries(compatibility)) {
      expect(new Set(slugs).size, industry).toBe(slugs.length);
    }
  });
});
