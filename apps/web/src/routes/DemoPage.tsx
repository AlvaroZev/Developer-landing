import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { ComplexityLevel } from "@triunder/domain";
import { getIndustryBySlug } from "@triunder/industry-registry";
import { getSolutionBySlug, isCompatible, isCompleteDemo } from "@triunder/solution-registry";
import { applyThemeToElement } from "@triunder/theme-system";
import { useThemeMode } from "../state/theme-context";
import { useI18n } from "../state/i18n-context";
import { useConfiguration } from "../state/config-context";
import { EngineDemo } from "../features/demo/EngineDemo";
import { parseModules } from "@triunder/demo-engine";

/**
 * Demo entry — restores configuration from URL and applies industry theme.
 * Shareable URLs: /explore/:industry/:solution/app/*?level=
 */
export function DemoPage() {
  const { industrySlug = "", solutionSlug = "" } = useParams();
  const [params] = useSearchParams();
  const { colorMode } = useThemeMode();
  const { messages, locale } = useI18n();
  const { updateConfiguration } = useConfiguration();

  const industry = getIndustryBySlug(industrySlug);
  const solution = getSolutionBySlug(solutionSlug);
  const levelParam = params.get("level");
  const complexity: ComplexityLevel =
    levelParam === "starter" || levelParam === "professional" || levelParam === "enterprise"
      ? levelParam
      : "professional";

  useEffect(() => {
    if (!industry || !solution || !isCompatible(industry.id, solution.id)) return;
    updateConfiguration({
      industryId: industry.id,
      solutionId: solution.id,
      complexity,
    });
    const tokens = industry.theme[colorMode];
    applyThemeToElement(document.documentElement, tokens);
  }, [industry, solution, complexity, colorMode, updateConfiguration]);

  if (!industry || !solution || !isCompatible(industry.id, solution.id)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-3xl">{messages.explore.incompatible}</h1>
        <Link to="/explore" className="mt-4 inline-block underline">
          {messages.common.back}
        </Link>
      </div>
    );
  }

  if (!isCompleteDemo(solution.demoTemplateId)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <p className="text-sm uppercase tracking-widest" style={{ color: "var(--tri-muted)" }}>
          {messages.demo.simulated}
        </p>
        <h1 className="mt-2 font-display text-3xl">
          {solution.name[locale]} · {industry.name[locale]}
        </h1>
        <p className="mt-4" style={{ color: "var(--tri-muted)" }}>
          {locale === "es"
            ? "Esta combinación está registrada. La demostración interactiva completa se está implementando."
            : "This combination is registered. The full interactive demonstration is being implemented."}
        </p>
        <Link
          to={`/explore/${industry.slug}`}
          className="mt-6 inline-block text-sm underline"
        >
          {messages.common.back}
        </Link>
      </div>
    );
  }

  return (
    <EngineDemo
      industrySlug={industry.slug}
      solutionSlug={solution.slug}
      complexity={complexity}
      modules={parseModules(params.get("modules"))}
      locale={locale}
    />
  );
}
