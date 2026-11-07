import { type InquiryInput, inquirySchema } from "@triunder/contracts";

/**
 * @triunder/domain
 *
 * Pure showroom rules that both tests and the API client can share:
 * inquiry compatibility, guest migration, and the visitor funnel.
 * Persistence and HTTP stay in the Go API. Demo workflows stay in demo-engine.
 */

export interface CatalogIndex {
  industries: string[];
  compatibility: Record<string, string[]>;
}

export type FieldErrors = Record<string, string>;

export function validateInquiry(
  input: unknown,
  catalog: CatalogIndex,
): { ok: true; value: InquiryInput } | { ok: false; fields: FieldErrors } {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    const fields: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
    }
    return { ok: false, fields };
  }
  const value = parsed.data;
  const fields: FieldErrors = {};
  if (!catalog.industries.includes(value.industrySlug)) fields.industrySlug = "unknown_industry";
  const allowed = catalog.compatibility[value.industrySlug] ?? [];
  if (value.industrySlug === "custom") {
    if (!value.customIndustry.trim()) fields.customIndustry = "required";
  } else if (!value.solutionSlug || !allowed.includes(value.solutionSlug)) {
    fields.solutionSlug = "incompatible_solution";
  }
  if (Object.keys(fields).length) return { ok: false, fields };
  return { ok: true, value };
}

export type MigrationDecision = "attach" | "already-attached" | "conflict";

/**
 * Guest migration is decided from the stored guest row, never from an id
 * typed by the browser. `already-attached` is idempotent success.
 */
export function migrationDecision(
  guest: { userId: string | null },
  userId: string,
): MigrationDecision {
  if (!guest.userId) return "attach";
  if (guest.userId === userId) return "already-attached";
  return "conflict";
}

export const funnel = [
  "page_view",
  "industry_selected",
  "solution_selected",
  "demo_started",
  "demo_interaction",
  "inquiry_started",
  "inquiry_submitted",
] as const;

export function conversionRate(demoStarted: number, inquiries: number): number {
  if (demoStarted <= 0) return 0;
  return Math.round((inquiries / demoStarted) * 1000) / 1000;
}
