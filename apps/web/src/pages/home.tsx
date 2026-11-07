import {
  capabilities,
  defaultFeatured,
  getIndustry,
  industries,
  processSteps,
  spotlightIndustries,
} from "@triunder/industry-registry";
import { getSolution, solutionsForIndustry } from "@triunder/solution-registry";
import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CascadePicker } from "../components/cascade-picker";
import { ConsentBanner, SiteFooter, SiteHeader } from "../components/chrome";
import { HeroField } from "../components/hero-field";
import { SelectedWorkSection } from "../components/projects";
import { track } from "../lib/analytics";
import { useLocale } from "../lib/locale";
import { useSession } from "../lib/session";

/**
 * The first screen is the product. Industry and solution are chosen here,
 * then the visitor enters that demonstration. Nothing else on this page is
 * allowed to sit above that choice.
 */
export function HomePage() {
  const { t, locale } = useLocale();
  const { config } = useSession();
  const [params, setParams] = useSearchParams();
  const industry = params.get("industry") ?? "";
  const solution = params.get("solution") ?? "";
  const custom = params.get("custom") ?? "";
  const industryDef = getIndustry(industry);
  const solutions = industry && industry !== "custom" ? solutionsForIndustry(industry) : [];
  const solutionDef = getSolution(solution);
  const ready =
    industry === "custom"
      ? custom.trim().length > 1
      : Boolean(industryDef && solutionDef && solutions.some((item) => item.slug === solution));

  useEffect(() => {
    track("page_view", { path: "/" });
  }, []);

  function setIndustry(next: string) {
    const query = new URLSearchParams(params);
    if (next) query.set("industry", next);
    else query.delete("industry");
    const allowed = solutionsForIndustry(next).map((item) => item.slug);
    if (!allowed.includes(solution)) query.delete("solution");
    setParams(query);
    track("industry_selected", { industry: next });
  }

  function setSolution(next: string) {
    const query = new URLSearchParams(params);
    if (next) query.set("solution", next);
    else query.delete("solution");
    setParams(query);
    track("solution_selected", { industry, solution: next });
  }

  const headline = config.copyOverrides[locale]?.headline || t("home.headline");
  const support = config.copyOverrides[locale]?.support || t("home.support");
  const featured = config.featuredDemos.length ? config.featuredDemos : defaultFeatured;
  const destination = useMemo(() => {
    if (!ready) return "";
    if (industry === "custom")
      return `/inquiry?industry=custom&custom=${encodeURIComponent(custom)}`;
    return `/explore/${industry}/${solution}`;
  }, [ready, industry, solution, custom]);

  const spotlight = spotlightIndustries
    .map((slug) => getIndustry(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div>
      <a className="skip" href="#selectors">
        {t("nav.skip")}
      </a>
      <div className="first-screen">
        <SiteHeader />
        <section className="mx-auto grid w-full max-w-page flex-1 px-4 pb-10 md:px-8">
          <div className="hero-grid">
            <div id="selectors" className="hero-copy">
              <p className="section-kicker">{t("home.eyebrow")}</p>
              <h1 className="mt-3 max-w-3xl font-serif text-[clamp(2.35rem,5.8vw,4.4rem)] leading-[1.02]">
                {headline}
              </h1>
              <p className="mt-4 max-w-xl text-lg text-[var(--muted)]">{support}</p>
              <div className="selector-stage">
                <div className="grid gap-3 sm:grid-cols-2">
                  <CascadePicker
                    label={t("home.industry")}
                    title={t("home.chooseIndustry")}
                    placeholder={t("home.industryPlaceholder")}
                    value={industry}
                    onChange={setIndustry}
                    options={industries.map((item) => ({
                      value: item.slug,
                      label: item.name[locale],
                      description: item.description[locale],
                      accent: item.theme.light.accent,
                    }))}
                  />
                  {industry === "custom" ? (
                    <label className="field">
                      <span>{t("home.customIndustry")}</span>
                      <input
                        value={custom}
                        placeholder={t("home.customPlaceholder")}
                        onChange={(event) => {
                          const query = new URLSearchParams(params);
                          query.set("custom", event.target.value);
                          setParams(query);
                        }}
                      />
                    </label>
                  ) : (
                    <CascadePicker
                      label={t("home.solution")}
                      title={t("home.chooseSolution")}
                      placeholder={t("home.solutionPlaceholder")}
                      waitingLabel={t("home.solutionWaiting")}
                      value={solutions.some((item) => item.slug === solution) ? solution : ""}
                      disabled={!industry}
                      onChange={setSolution}
                      options={solutions.map((item) => ({
                        value: item.slug,
                        label: item.name[locale],
                        description: item.description[locale],
                        accent: industryDef?.theme.light.accent,
                      }))}
                    />
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  {ready ? (
                    <Link className="btn-accent" to={destination}>
                      {industry === "custom" ? t("home.customCta") : t("home.cta")}
                    </Link>
                  ) : (
                    <button type="button" className="btn-accent" disabled>
                      {industry === "custom" ? t("home.customCta") : t("home.cta")}
                    </button>
                  )}
                  <p className="max-w-sm text-sm text-[var(--muted)]">
                    {ready ? t("home.ready") : t("home.hint")}
                  </p>
                </div>
              </div>
            </div>
            <aside className="hero-aside panel-elevated overflow-hidden" aria-live="polite">
              <div className="hero-aside__stage">
                <HeroField
                  accent={industryDef?.theme.light.accent ?? "#0d9f8f"}
                  primary={industryDef?.theme.light.primary ?? "#07111f"}
                  secondary={industryDef?.theme.light.secondary ?? "#1d4ed8"}
                  active={Boolean(industryDef && industry !== "custom")}
                />
                <div className="hero-aside__meta">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    {industryDef ? industryDef.name[locale] : t("home.previewLabel")}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl leading-tight">
                    {solutionDef && industry !== "custom"
                      ? solutionDef.name[locale]
                      : (industryDef?.name[locale] ?? "Triunder")}
                  </h2>
                  <p className="mt-3 max-w-md text-sm text-[var(--muted)] md:text-[0.95rem]">
                    {solutionDef && industry !== "custom"
                      ? solutionDef.description[locale]
                      : (industryDef?.description[locale] ?? t("home.support"))}
                  </p>
                  {industryDef && industry !== "custom" ? (
                    <p className="mt-4 text-sm font-semibold text-[var(--accent)]">
                      {t("home.compatibleCount", { count: solutions.length })}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-[var(--muted)]">{t("brand.tagline")}</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>

      <SelectedWorkSection />

      <section
        id="capabilities"
        className="border-y border-[var(--border)] bg-[var(--surface)]"
        aria-labelledby="capabilities-title"
      >
        <div className="section mx-auto max-w-page px-4 md:px-8">
          <p className="section-kicker">{t("home.capabilities")}</p>
          <h2 id="capabilities-title" className="section-title">
            {t("home.capabilities")}
          </h2>
          <p className="section-lead">{t("home.capabilitiesLead")}</p>
          <div className="capability-rail mt-10">
            <div className="grid gap-3 sm:grid-cols-2">
              {capabilities.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to={`/explore/${item.industry}/${item.solution}`}
                  className="capability-item no-underline"
                >
                  <h3 className="font-serif text-2xl">{item.title[locale]}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">{item.body[locale]}</p>
                </Link>
              ))}
            </div>
            <div className="grid gap-3">
              {capabilities.slice(4).map((item) => (
                <Link
                  key={item.id}
                  to={`/explore/${item.industry}/${item.solution}`}
                  className="capability-item no-underline"
                >
                  <h3 className="font-serif text-2xl">{item.title[locale]}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">{item.body[locale]}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section mx-auto max-w-page px-4 md:px-8" aria-labelledby="industries-title">
        <p className="section-kicker">{t("home.industries")}</p>
        <h2 id="industries-title" className="section-title">
          {t("home.industries")}
        </h2>
        <p className="section-lead">{t("home.industriesLead")}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {spotlight.map((item) => {
            const first = item.solutionSlugs[0];
            return (
              <button
                key={item.slug}
                type="button"
                className="industry-chip text-left"
                onClick={() => setIndustry(item.slug)}
              >
                <span
                  className="h-2 w-10 rounded-full"
                  style={{ background: item.theme.light.accent }}
                />
                <strong className="font-serif text-xl">{item.name[locale]}</strong>
                <span className="text-sm text-[var(--muted)] line-clamp-2">
                  {item.description[locale]}
                </span>
                {first ? (
                  <Link
                    className="mt-auto text-sm font-semibold text-[var(--accent)]"
                    to={`/explore/${item.slug}/${first}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {t("home.openDemo")}
                  </Link>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="section mx-auto max-w-page px-4 md:px-8" aria-labelledby="featured-title">
        <p className="section-kicker">{t("home.featured")}</p>
        <h2 id="featured-title" className="section-title">
          {t("home.featured")}
        </h2>
        <p className="section-lead">{t("home.featuredLead")}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {featured.map((item) => {
            const ind = getIndustry(item.industry);
            const sol = getSolution(item.solution);
            if (!ind || !sol) return null;
            return (
              <Link
                key={`${item.industry}-${item.solution}`}
                to={`/explore/${item.industry}/${item.solution}`}
                className="panel block overflow-hidden no-underline"
              >
                <div
                  className="h-2"
                  style={{
                    background: `linear-gradient(90deg, ${ind.theme.light.primary}, ${ind.theme.light.accent})`,
                  }}
                />
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--accent)]">
                    {ind.name[locale]}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl">{sol.name[locale]}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">{sol.description[locale]}</p>
                  <span className="mt-4 inline-block text-sm font-semibold">
                    {t("home.openDemo")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="process-band">
        <div className="section mx-auto grid max-w-page gap-6 px-4 md:grid-cols-4 md:px-8">
          <div className="md:col-span-4">
            <p className="text-sm font-bold uppercase tracking-[0.16em] opacity-80">
              {t("home.process")}
            </p>
            <h2 className="mt-2 font-serif text-4xl">{t("home.process")}</h2>
            <p className="mt-2 max-w-2xl opacity-80">{t("home.processLead")}</p>
          </div>
          {processSteps.map((step, index) => (
            <article key={step.title.en} className="step">
              <p className="text-sm opacity-70">0{index + 1}</p>
              <h3 className="mt-2 font-serif text-2xl">{step.title[locale]}</h3>
              <p className="mt-2 text-sm opacity-80">{step.body[locale]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-page px-4 py-16 md:px-8">
        <div className="cta-band">
          <h2 className="font-serif text-4xl">{t("home.inquiryTitle")}</h2>
          <p className="mt-2 max-w-xl opacity-85">{t("home.inquiryLead")}</p>
          <Link className="btn-accent mt-6" to={destination || "/inquiry"}>
            {t("home.inquiryCta")}
          </Link>
        </div>
      </section>
      <SiteFooter />
      <ConsentBanner />
    </div>
  );
}
