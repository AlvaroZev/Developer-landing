import { Link, useParams } from "react-router-dom";
import { getIndustryBySlug, listIndustries } from "@triunder/industry-registry";
import { listCompatibleSolutions } from "@triunder/solution-registry";
import { useI18n } from "../state/i18n-context";

export function ExploreIndustryPage() {
  const { industrySlug } = useParams();
  const { messages, locale } = useI18n();

  if (!industrySlug) {
    const industries = listIndustries();
    return (
      <div className="tri-container py-10 md:py-14">
        <h1 className="tri-section-title">{messages.explore.selectIndustry}</h1>
        <p className="tri-lede mt-3">{messages.home.industriesSupport}</p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <Link key={industry.id} to={`/explore/${industry.slug}`} className="tri-card p-5">
              <div
                className="h-1.5 w-10 rounded-full"
                style={{ background: industry.theme.light.accent }}
              />
              <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em]">
                {industry.name[locale]}
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--tri-muted)" }}>
                {industry.description[locale]}
              </p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const industry = getIndustryBySlug(industrySlug);
  if (!industry) {
    return (
      <div className="tri-container py-20">
        <h1 className="tri-section-title">{messages.common.error}</h1>
        <Link to="/explore" className="tri-btn tri-btn-ghost mt-6">
          {messages.common.back}
        </Link>
      </div>
    );
  }

  const solutions = listCompatibleSolutions(industry.id);

  return (
    <div className="tri-container py-10 md:py-14">
      <p className="text-sm font-medium uppercase tracking-[0.16em]" style={{ color: "var(--tri-accent)" }}>
        {messages.explore.selectIndustry}
      </p>
      <h1 className="tri-section-title mt-3">{industry.name[locale]}</h1>
      <p className="tri-lede mt-4">{industry.description[locale]}</p>

      <h2 className="mt-12 text-2xl font-semibold tracking-[-0.03em]">
        {messages.explore.selectSolution}
      </h2>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {solutions.map((solution) => (
          <Link
            key={solution.id}
            to={`/explore/${industry.slug}/${solution.slug}?level=${solution.defaultComplexity}`}
            className="tri-card p-5"
          >
            <h3 className="text-lg font-semibold tracking-[-0.02em]">{solution.name[locale]}</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--tri-muted)" }}>
              {solution.description[locale]}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
