import { z } from "zod";

/**
 * @triunder/contracts
 *
 * Shapes shared by the web app and the API contract tests.
 * The Go API validates the same limits. If you change a limit here, change
 * `apps/api/internal/httpapi/validate.go` and the contract fixture in tests.
 *
 * These types describe the showroom: users, guests, inquiries, and events.
 * They are not a tenant or billing model.
 */

export const locales = ["en", "es"] as const;
export const inquiryStatuses = [
  "draft",
  "submitted",
  "in_discussion",
  "completed",
  "archived",
] as const;
export const userRoles = ["user", "admin"] as const;

export const analyticsEvents = [
  "page_view",
  "industry_selected",
  "solution_selected",
  "demo_started",
  "demo_interaction",
  "demo_completed",
  "inquiry_started",
  "inquiry_submitted",
  "account_registered",
] as const;

export type AnalyticsEventName = (typeof analyticsEvents)[number];
export type InquiryStatus = (typeof inquiryStatuses)[number];
export type UserRole = (typeof userRoles)[number];

export const emailSchema = z.string().trim().email().max(180);
export const passwordSchema = z
  .string()
  .min(10)
  .max(200)
  .regex(/[A-Za-z]/, "letter")
  .regex(/[0-9]/, "number");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  preferredLanguage: z.enum(locales).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});

export const inquirySchema = z.object({
  industrySlug: z.string().trim().min(1).max(80),
  solutionSlug: z.string().trim().max(80).default(""),
  customIndustry: z.string().trim().max(160).default(""),
  problem: z.string().trim().min(20).max(4000),
  desired: z.string().trim().max(4000).default(""),
  details: z.string().trim().max(4000).default(""),
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  company: z.string().trim().max(160).default(""),
});

export const profileSchema = z.object({
  firstName: z.string().trim().max(80).default(""),
  lastName: z.string().trim().max(80).default(""),
  company: z.string().trim().max(160).default(""),
  jobTitle: z.string().trim().max(120).default(""),
  industry: z.string().trim().max(80).default(""),
  country: z.string().trim().max(80).default(""),
  city: z.string().trim().max(80).default(""),
  phone: z.string().trim().max(40).default(""),
  website: z.string().trim().max(200).default(""),
  companySize: z.string().trim().max(40).default(""),
  description: z.string().trim().max(2000).default(""),
  avatarUrl: z.string().trim().max(400).default(""),
  preferredLanguage: z.enum(locales).default("en"),
});

export const analyticsMetadataSchema = z
  .object({
    industry: z.string().max(80).optional(),
    solution: z.string().max(80).optional(),
    path: z.string().max(200).optional(),
    demoId: z.string().max(120).optional(),
    status: z.string().max(40).optional(),
  })
  .strict();

export const analyticsBatchSchema = z.object({
  consent: z.literal(true),
  events: z
    .array(
      z.object({
        eventType: z.enum(analyticsEvents),
        metadata: analyticsMetadataSchema.optional(),
      }),
    )
    .min(1)
    .max(20),
});

export const aiAssistSchema = z.object({
  mode: z.enum(["describe", "requirements"]),
  industrySlug: z.string().trim().min(1).max(80),
  solutionSlug: z.string().trim().max(80).default(""),
  problem: z.string().trim().min(10).max(4000),
  desired: z.string().trim().max(4000).default(""),
  locale: z.enum(locales).default("en"),
});

export const aiAssistResultSchema = z.object({
  problem: z.string().trim().min(20).max(2000),
  desired: z.string().trim().max(2000),
  notes: z.string().trim().max(1000),
});

export const inquiryNoteSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const inquiryStatusSchema = z.object({
  status: z.enum(inquiryStatuses),
});

export interface ApiError {
  error: { code: string; message: string; fields?: Record<string, string> };
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

export interface Profile {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  industry: string;
  country: string;
  city: string;
  phone: string;
  website: string;
  companySize: string;
  description: string;
  avatarUrl: string;
  preferredLanguage: "en" | "es";
}

export interface Inquiry {
  id: string;
  industrySlug: string;
  solutionSlug: string;
  customIndustry: string;
  problem: string;
  desired: string;
  details: string;
  name: string;
  email: string;
  company: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConfig {
  ai: {
    provider: "openai";
    status: "configured" | "missing_credentials" | "connection_error" | "disabled";
    model: string;
    features: {
      projectDescription: boolean;
      requirementsAssistance: boolean;
    };
  };
  oauth: { google: boolean };
  featuredDemos: { industry: string; solution: string }[];
  hiddenCaseStudies: string[];
  copyOverrides: {
    en?: { headline?: string; support?: string };
    es?: { headline?: string; support?: string };
  };
}

export type InquiryInput = z.infer<typeof inquirySchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type AiAssistResult = z.infer<typeof aiAssistResultSchema>;
