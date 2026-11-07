import { describe, expect, it } from "vitest";
import { runCatalogReport } from "./index";

describe("catalog report", () => {
  it("passes every registered demonstration", () => {
    const report = runCatalogReport();
    expect(report.failures).toEqual([]);
    expect(report.pairs).toBeGreaterThan(100);
  });
});
