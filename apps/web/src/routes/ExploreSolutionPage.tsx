import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { ComplexityLevel } from "@triunder/domain";
import { COMPLEXITY_PROFILES } from "@triunder/domain";
import { getIndustryBySlug } from "@triunder/industry-registry";
import { getSolutionBySlug, isCompatible } from "@triunder/solution-registry";
import { useConfiguration } from "../state/config-context";
import { useI18n } from "../state/i18n-context";

const LEVELS: ComplexityLevel[] = ["starter", "professional", "enterprise"];

export function ExploreSolutionPage() {
  const { industrySlug = "", solutionSlug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { messages, locale } = useI18n();
  const { updateConfiguration } = useConfiguration();

  const industry = getIndustryBySlug(industrySlug);
  const solution = getSolutionBySlug(solutionSlug);
  const levelParam = params.get("level");
  const complexity: ComplexityLevel =
    levelParam === "starter" || levelParam === "professional" || levelParam === "enterprise"
      ? levelParam
      : solution?.defaultComplexity ?? "professional";

  if (!industry || !solution || !isCompatible(industry.id, solution.id)) {
    return (
      <div className="tri-container py-20">
        <h1 className="tri-section-title">{messages.explore.incompatible}</h1>
        <Link to={`/explore/${industrySlug || ""}`} className="tri-btn tri-btn-ghost mt-6">
          {messages.common.back}
        </Link>
      </div>
    );
  }

  const enter = () => {
    updateConfiguration({
      industryId: industry.id,
      solutionId: solution.id,
      complexity,
      moduleIds: [],
    });
    navigate(`/explore/${industry.slug}/${solution.slug}/app/dashboard?level=${complexity}`);
  };

  return (
    <div className="tri-container max-w-4xl py-10 md:py-14">
      <p className="text-sm" style={{ color: "var(--tri-muted)" }}>
        {industry.name[locale]} / {solution.name[locale]}
      </p>
      <h1 className="tri-section-title mt-3">{solution.name[locale]}</h1>
      <p className="tri-lede mt-4">{solution.description[locale]}</p>

      <h2 className="mt-12 text-2xl font-semibold tracking-[-0.03em]">
        {messages.explore.selectComplexity}
      </h2>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {LEVELS.map((level) => {
          const profile = COMPLEXITY_PROFILES[level][locale];
          const selected = complexity === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("level", level);
                setParams(next, { replace: true });
              }}
              className="tri-card p-5 text-left"
              style={{
                borderColor: selected ? "var(--tri-accent)" : undefined,
                boxShadow: selected ? "0 0 0 1px var(--tri-accent), var(--shadow-soft)" : undefined,
              }}
            >
              <div className="font-semibold tracking-[-0.02em]">{profile.name}</div>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--tri-muted)" }}>
                {profile.description}
              </p>
            </button>
          );
        })}
      </div>

      <button type="button" onClick={enter} className="tri-btn tri-btn-primary mt-10">
        {messages.explore.enterDemo}
        <span aria-hidden>↗</span>
      </button>
    </div>
  );
}
