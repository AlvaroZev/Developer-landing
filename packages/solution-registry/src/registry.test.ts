import { describe, expect, it } from "vitest";
import { industries } from "@triunder/industry-registry";
import {
  COMPLETE_DEMO_TEMPLATE_IDS,
  getSolutionById,
  isCompatible,
  listCompatiblePairs,
  listSolutions,
} from "./index.js";

describe("solution registry contracts", () => {
  const solutions = listSolutions();

  it("every solution has unique id and slug", () => {
    expect(new Set(solutions.map((s) => s.id)).size).toBe(solutions.length);
    expect(new Set(solutions.map((s) => s.slug)).size).toBe(solutions.length);
  });

  it("every industry primarySolution exists and is compatible", () => {
    for (const industry of industries) {
      const solution = getSolutionById(industry.primarySolution);
      expect(
        solution,
        `missing solution for ${industry.slug} → ${industry.primarySolution}`,
      ).toBeTruthy();
      expect(isCompatible(industry.slug, industry.primarySolution)).toBe(true);
    }
  });

  it("compatible pairs matrix is non-empty", () => {
    expect(listCompatiblePairs().length).toBeGreaterThan(0);
  });

  it("includes flagship complete demo templates", () => {
    expect(COMPLETE_DEMO_TEMPLATE_IDS).toEqual(
      expect.arrayContaining(["crm", "ecommerce", "mes", "fleet", "agriculture-iot"]),
    );
  });
});
