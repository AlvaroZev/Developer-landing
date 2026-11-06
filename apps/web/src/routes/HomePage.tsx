import { Link } from "react-router-dom";
import { listIndustries } from "@triunder/industry-registry";
import { TriunderMark } from "../components/brand/TriunderMark";
import { useI18n } from "../state/i18n-context";
import { FeaturedDemos } from "../features/home/FeaturedDemos";
import { CapabilitiesStrip } from "../features/home/CapabilitiesStrip";

/**
 * Homepage IS the showroom entrance — not a static marketing page.
 * Visitors can begin configuring a solution directly from here.
 */
export function HomePage() {
  const { messages, locale } = useI18n();
  const industries = listIndustries();

  return (
    <div>
      <section className="relative overflow-hidden pb-8 pt-6 md:pt-10">
        <div className="tri-grid-bg pointer-events-none absolute inset-0" />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "var(--tri-glow)" }}
        />

        <div className="tri-container relative">
          <div
            className="tri-card animate-scale-in relative overflow-hidden px-6 py-12 md:px-12 md:py-16"
            style={{
              boxShadow: "var(--shadow-soft), 0 0 80px var(--tri-glow)",
            }}
          >
            <div className="absolute inset-0 opacity-40" style={{
              background:
                "radial-gradient(800px 320px at 85% 15%, color-mix(in srgb, var(--tri-accent) 22%, transparent), transparent 60%)",
            }} />

            <div className="relative max-w-3xl">
              <div className="mb-7 inline-flex items-center gap-3 rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{ borderColor: "var(--tri-border)", color: "var(--tri-muted)" }}>
                <TriunderMark size={18} animated />
                {messages.brand.tagline}
              </div>

              <p className="animate-fade-up text-sm font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--tri-accent)" }}>
                {messages.home.brand}
              </p>

              <h1 className="animate-fade-up delay-1 mt-4 text-[clamp(2.4rem,6vw,4.4rem)] font-semibold tracking-[-0.04em]">
                {messages.home.headline}
              </h1>

              <p className="animate-fade-up delay-2 tri-lede mt-5">
                {messages.home.support}
              </p>

              <div className="animate-fade-up delay-3 mt-9 flex flex-wrap gap-3">
                <Link to="/explore" className="tri-btn tri-btn-primary">
                  {messages.home.ctaExplore}
                  <span aria-hidden>↗</span>
                </Link>
                <Link to="/project-builder" className="tri-btn tri-btn-ghost">
                  {messages.home.ctaBuilder}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tri-container py-16 md:py-20">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="tri-section-title">{messages.home.industriesHeading}</h2>
            <p className="tri-lede mt-3">{messages.home.industriesSupport}</p>
          </div>
          <Link to="/explore" className="tri-btn tri-btn-ghost self-start md:self-auto">
            {messages.nav.explore}
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {industries.map((industry) => (
            <Link
              key={industry.id}
              to={`/explore/${industry.slug}`}
              className="tri-card group p-5"
            >
              <div
                className="mb-4 h-1.5 w-10 rounded-full transition-all group-hover:w-16"
                style={{ background: industry.theme.light.accent }}
              />
              <div className="text-[0.98rem] font-semibold tracking-[-0.02em]">
                {industry.name[locale]}
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--tri-muted)" }}>
                {industry.description[locale]}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <FeaturedDemos />
      <CapabilitiesStrip />

      <section className="tri-container py-16 md:py-20">
        <div className="tri-card p-8 md:p-10">
          <h2 className="tri-section-title">{messages.home.projectsHeading}</h2>
          <p className="tri-lede mt-3">{messages.home.projectsSupport}</p>
          <Link to="/projects" className="tri-btn tri-btn-ghost mt-7">
            {messages.nav.projects}
            <span aria-hidden>→</span>
          </Link>
          <p className="mt-8 text-xs" style={{ color: "var(--tri-muted)" }}>
            {messages.home.simulationNote}
          </p>
        </div>
      </section>
    </div>
  );
}
