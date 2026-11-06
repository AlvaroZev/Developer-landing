import type { TerminologyDictionary } from "@triunder/domain";
import type { IndustryDefinition as NewIndustry } from "./types.js";
import { industries } from "./industries.js";

/**
 * Showroom shell compatibility view of an industry.
 * New code should prefer IndustryDefinition from ./types.
 */
export interface ShowroomIndustry {
  id: string;
  slug: string;
  name: { en: string; es: string };
  description: { en: string; es: string };
  icon: string;
  theme: NewIndustry["theme"];
  terminology: { en: TerminologyDictionary; es: TerminologyDictionary };
  supportedSolutionIds: string[];
  featuredModuleIds: string[];
  suggestedIntegrationIds: string[];
  metrics: string[];
  workflows: string[];
  primarySolution: string;
}

function toTerminology(industry: NewIndustry, locale: "en" | "es"): TerminologyDictionary {
  return {
    entitySingular: industry.terminology.subject[locale],
    entityPlural: `${industry.terminology.subject[locale]}s`,
    secondaryEntitySingular: industry.terminology.event[locale],
    secondaryEntityPlural: `${industry.terminology.event[locale]}s`,
    primaryAction: industry.workflows[0]?.[locale] ?? "Open",
    metricPrimary: industry.metrics[0]?.[locale] ?? "Primary metric",
    metricSecondary: industry.metrics[1]?.[locale] ?? "Secondary metric",
    workflowLabel: industry.terminology.work[locale],
  };
}

function toShowroom(industry: NewIndustry): ShowroomIndustry {
  return {
    id: industry.slug,
    slug: industry.slug,
    name: industry.name,
    description: industry.description,
    icon: industry.icon,
    theme: industry.theme,
    terminology: {
      en: toTerminology(industry, "en"),
      es: toTerminology(industry, "es"),
    },
    supportedSolutionIds: [industry.primarySolution],
    featuredModuleIds: industry.featuredModules,
    suggestedIntegrationIds: industry.integrations.map((i) => i.en),
    metrics: industry.metrics.map((m) => m.en),
    workflows: industry.workflows.map((w) => w.en),
    primarySolution: industry.primarySolution,
  };
}

const showroomIndustries = industries.map(toShowroom);
const bySlug = new Map(showroomIndustries.map((i) => [i.slug, i]));

export function listShowroomIndustries(): readonly ShowroomIndustry[] {
  return showroomIndustries;
}

export function getIndustryBySlug(slug: string): ShowroomIndustry | undefined {
  return bySlug.get(slug);
}

export function getIndustryById(id: string): ShowroomIndustry | undefined {
  return bySlug.get(id);
}

export function requireIndustryBySlug(slug: string): ShowroomIndustry {
  const industry = bySlug.get(slug);
  if (!industry) throw new Error(`Unknown industry slug: ${slug}`);
  return industry;
}

export function industrySupportsSolution(industryId: string, solutionId: string): boolean {
  const industry = bySlug.get(industryId);
  return industry?.supportedSolutionIds.includes(solutionId) ?? false;
}
