import { Link, useParams } from "react-router-dom";
import { getIndustryBySlug, listIndustries } from "@triunder/industry-registry";
import { useConfiguration } from "../state/config-context";
import { useI18n } from "../state/i18n-context";

export function ProjectBuilderPage() {
  const { industrySlug } = useParams();
  const { messages, locale } = useI18n();
  const { configuration } = useConfiguration();
  const industry = industrySlug ? getIndustryBySlug(industrySlug) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
      <h1 className="font-display text-4xl">{messages.nav.builder}</h1>
      <p className="mt-3" style={{ color: "var(--tri-muted)" }}>
        {locale === "es"
          ? "Combine industria, solución, complejidad y módulos para generar un alcance preliminar. Sin precios ni plazos inventados."
          : "Combine industry, solution, complexity, and modules into a preliminary scope. No fabricated pricing or delivery dates."}
      </p>

      {configuration ? (
        <div
          className="mt-8 rounded border p-5"
          style={{ borderColor: "var(--tri-border)", background: "var(--tri-surface)" }}
        >
          <p className="text-sm font-medium">{messages.explore.configuration}</p>
          <p className="mt-2 text-sm" style={{ color: "var(--tri-muted)" }}>
            {configuration.industryId} · {configuration.solutionId} · {configuration.complexity}
          </p>
          <Link
            to={`/explore/${configuration.industryId}/${configuration.solutionId}?level=${configuration.complexity}`}
            className="mt-4 inline-block text-sm underline"
          >
            {messages.explore.enterDemo}
          </Link>
        </div>
      ) : (
        <div className="mt-10">
          <h2 className="font-display text-2xl">{messages.explore.selectIndustry}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(industry ? [industry] : listIndustries()).map((item) => (
              <Link
                key={item.id}
                to={`/explore/${item.slug}`}
                className="border-b py-3 text-sm"
                style={{ borderColor: "var(--tri-border)" }}
              >
                {item.name[locale]}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
