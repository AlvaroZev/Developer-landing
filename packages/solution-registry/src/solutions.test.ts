import { describe, expect, it } from "vitest";
import { getSolutionById, getSolutionBySlug, listSolutions } from "./index.js";

describe("solution catalog", () => {
  it("has unique slugs and both languages", () => {
    const slugs = listSolutions().map((solution) => solution.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const solution of listSolutions()) {
      expect(solution.name.en.trim().length).toBeGreaterThan(0);
      expect(solution.name.es.trim().length).toBeGreaterThan(0);
      expect(solution.description.en.trim().length).toBeGreaterThan(0);
      expect(solution.description.es.trim().length).toBeGreaterThan(0);
      expect(solution.compatibleIndustryIds.length).toBeGreaterThan(0);
    }
  });

  it("exposes the solutions the flagship demos need", () => {
    expect(getSolutionBySlug("crm")).toBeDefined();
    expect(getSolutionBySlug("ecommerce")).toBeDefined();
    expect(getSolutionBySlug("mes")).toBeDefined();
    expect(getSolutionBySlug("fleet")).toBeDefined();
    expect(getSolutionBySlug("iot")).toBeDefined();
    expect(getSolutionById("fleet-management")).toBeDefined();
    expect(getSolutionById("smart-agriculture")).toBeDefined();
    expect(getSolutionById("order-management")).toBeDefined();
  });
});
