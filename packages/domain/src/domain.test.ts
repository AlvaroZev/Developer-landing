import { describe, expect, it } from "vitest";
import { conversionRate, migrationDecision, validateInquiry } from "./index";

const catalog = {
  industries: ["healthcare", "custom"],
  compatibility: { healthcare: ["scheduling"], custom: [] },
};

describe("domain rules", () => {
  it("accepts a compatible inquiry and rejects a mismatched solution", () => {
    const good = validateInquiry(
      {
        industrySlug: "healthcare",
        solutionSlug: "scheduling",
        problem: "Follow-up visits are being missed across two clinics.",
        name: "Nora Hale",
        email: "nora@example.com",
      },
      catalog,
    );
    expect(good.ok).toBe(true);
    const bad = validateInquiry(
      {
        industrySlug: "healthcare",
        solutionSlug: "robotics",
        problem: "Follow-up visits are being missed across two clinics.",
        name: "Nora Hale",
        email: "nora@example.com",
      },
      catalog,
    );
    expect(bad.ok).toBe(false);
  });

  it("requires a description for a custom industry", () => {
    const result = validateInquiry(
      {
        industrySlug: "custom",
        problem: "We run a regional water utility and still dispatch crews on paper.",
        name: "Nora Hale",
        email: "nora@example.com",
      },
      catalog,
    );
    expect(result.ok).toBe(false);
  });

  it("migrates a guest once and refuses a second owner", () => {
    expect(migrationDecision({ userId: null }, "user-1")).toBe("attach");
    expect(migrationDecision({ userId: "user-1" }, "user-1")).toBe("already-attached");
    expect(migrationDecision({ userId: "user-1" }, "user-2")).toBe("conflict");
  });

  it("does not invent a conversion rate without demo starts", () => {
    expect(conversionRate(0, 4)).toBe(0);
    expect(conversionRate(8, 2)).toBe(0.25);
  });
});
