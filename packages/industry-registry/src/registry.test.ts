import { describe, expect, it } from "vitest";
import {
  getIndustryBySlug,
  industries,
  industryThemeComplete,
  listIndustries,
  listShowroomIndustries,
} from "./index.js";

describe("industry registry contracts", () => {
  it("registers at least 20 industries", () => {
    expect(industries.length).toBeGreaterThanOrEqual(20);
  });

  it("every industry has a unique slug", () => {
    const slugs = industries.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(industries.map((i) => [i.slug, i] as const))(
    "industry %s has complete metadata and theme",
    (_slug, industry) => {
      expect(industry.slug).toMatch(/^[a-z0-9-]+$/);
      expect(industry.name.en).toBeTruthy();
      expect(industry.name.es).toBeTruthy();
      expect(industry.description.en).toBeTruthy();
      expect(industry.description.es).toBeTruthy();
      expect(industry.primarySolution).toBeTruthy();
      expect(industryThemeComplete(industry)).toBe(true);
    },
  );

  it("showroom compat list mirrors registry", () => {
    expect(listIndustries().length).toBe(listShowroomIndustries().length);
    expect(getIndustryBySlug("healthcare")?.primarySolution).toBe("crm");
  });
});
