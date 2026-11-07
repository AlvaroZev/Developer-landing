import { describe, expect, it } from "vitest";
import { aiAssistResultSchema, inquirySchema, registerSchema } from "./index";

describe("contracts", () => {
  it("accepts a complete inquiry and rejects a short problem", () => {
    const parsed = inquirySchema.safeParse({
      industrySlug: "healthcare",
      solutionSlug: "scheduling",
      problem: "Clinics lose follow-up visits because the schedule lives in three inboxes.",
      name: "Nora Hale",
      email: "nora@example.com",
    });
    expect(parsed.success).toBe(true);
    const bad = inquirySchema.safeParse({
      industrySlug: "healthcare",
      problem: "too short",
      name: "Nora Hale",
      email: "nora@example.com",
    });
    expect(bad.success).toBe(false);
  });

  it("requires a letter and a number in passwords", () => {
    expect(
      registerSchema.safeParse({ email: "a@example.com", password: "longpassword" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ email: "a@example.com", password: "longpassword1" }).success,
    ).toBe(true);
  });

  it("rejects AI output that is too thin to show a visitor", () => {
    expect(
      aiAssistResultSchema.safeParse({ problem: "short", desired: "", notes: "" }).success,
    ).toBe(false);
  });
});
