/**
 * Compatibility aliases for the showroom UI while domain vocabulary stabilizes.
 * Prefer Complexity / LocaleText / DemoState for new code.
 *
 * NOTE: This file must not import from ./index.js (circular). Keep helpers self-contained.
 */

export type ComplexityLevel = "starter" | "professional" | "enterprise";
export type ColorMode = "light" | "dark";
export type CompatLocale = "en" | "es";

export interface ProjectConfiguration {
  industryId: string;
  solutionId: string;
  complexity: ComplexityLevel;
  moduleIds: string[];
  locale: CompatLocale;
  colorMode: ColorMode;
  customDescription?: string;
}

export interface TerminologyDictionary {
  entitySingular: string;
  entityPlural: string;
  secondaryEntitySingular: string;
  secondaryEntityPlural: string;
  primaryAction: string;
  metricPrimary: string;
  metricSecondary: string;
  workflowLabel: string;
  [key: string]: string;
}

function rank(level: ComplexityLevel): number {
  if (level === "starter") return 0;
  if (level === "professional") return 1;
  return 2;
}

/** Legacy signature: (requiredMinimum, currentLevel) */
export function meetsComplexityLegacy(
  required: ComplexityLevel | undefined,
  current: ComplexityLevel,
): boolean {
  if (!required) return true;
  return rank(current) >= rank(required);
}

export const COMPLEXITY_PROFILES: Record<
  ComplexityLevel,
  { en: { name: string; description: string }; es: { name: string; description: string } }
> = {
  starter: {
    en: {
      name: "Starter",
      description: "CRUD, basic dashboards, standard forms, and essential workflows.",
    },
    es: {
      name: "Inicial",
      description: "CRUD, paneles básicos, formularios estándar y flujos esenciales.",
    },
  },
  professional: {
    en: {
      name: "Professional",
      description: "Analytics, automated workflows, notifications, and advanced reporting.",
    },
    es: {
      name: "Profesional",
      description: "Analítica, flujos automatizados, notificaciones e informes avanzados.",
    },
  },
  enterprise: {
    en: {
      name: "Enterprise",
      description:
        "Departmental workflows, audit logs, approval flows, and enterprise configuration.",
    },
    es: {
      name: "Empresarial",
      description:
        "Flujos departamentales, auditoría, aprobaciones y configuración empresarial.",
    },
  },
};
