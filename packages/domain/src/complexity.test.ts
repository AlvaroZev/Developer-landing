import { describe, expect, it } from "vitest";
import { meetsComplexity, meetsComplexityLegacy } from "./index.js";

describe("meetsComplexity", () => {
  it("uses (current, minimum) ordering", () => {
    expect(meetsComplexity("starter", undefined)).toBe(true);
    expect(meetsComplexity("starter", "professional")).toBe(false);
    expect(meetsComplexity("professional", "professional")).toBe(true);
    expect(meetsComplexity("enterprise", "professional")).toBe(true);
  });

  it("legacy helper uses (required, current) ordering", () => {
    expect(meetsComplexityLegacy(undefined, "starter")).toBe(true);
    expect(meetsComplexityLegacy("professional", "starter")).toBe(false);
    expect(meetsComplexityLegacy("professional", "enterprise")).toBe(true);
  });
});
