import { useState } from "react";
import { Link } from "react-router-dom";
import { getIndustryById } from "@triunder/industry-registry";
import { getSolutionById } from "@triunder/solution-registry";
import { useConfiguration } from "../../state/config-context";
import { useI18n } from "../../state/i18n-context";

/**
 * Persistent configuration chrome — survives navigation between showroom experiences.
 * Collapsible on mobile per product requirements.
 */
export function ConfigurationSummary() {
  const { configuration } = useConfiguration();
  const { messages, locale } = useI18n();
  const [open, setOpen] = useState(false);

  if (!configuration) return null;

  const industry = getIndustryById(configuration.industryId);
  const solution = getSolutionById(configuration.solutionId);
  if (!industry || !solution) return null;

  const exploreHref = `/explore/${industry.slug}/${solution.slug}?level=${configuration.complexity}`;

  return (
    <aside
      className="fixed bottom-4 right-4 z-50 w-[min(100%-2rem,22rem)] overflow-hidden rounded-2xl border shadow-[var(--shadow-nav)] backdrop-blur-xl"
      style={{
        background: "color-mix(in srgb, var(--tri-surface) 90%, transparent)",
        borderColor: "var(--tri-border)",
      }}
      aria-label={messages.config.expand}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left md:cursor-default"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold tracking-[-0.02em]">
          {messages.explore.configuration}
        </span>
        <span className="text-xs md:hidden" style={{ color: "var(--tri-muted)" }}>
          {open ? messages.config.collapse : messages.config.expand}
        </span>
      </button>

      <div
        className={`${open ? "block" : "hidden"} border-t px-4 pb-4 md:block`}
        style={{ borderColor: "var(--tri-border)" }}
      >
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt style={{ color: "var(--tri-muted)" }}>{messages.config.industry}</dt>
            <dd className="font-medium">{industry.name[locale]}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt style={{ color: "var(--tri-muted)" }}>{messages.config.solution}</dt>
            <dd className="font-medium">{solution.name[locale]}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt style={{ color: "var(--tri-muted)" }}>{messages.config.complexity}</dt>
            <dd className="capitalize font-medium">{configuration.complexity}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt style={{ color: "var(--tri-muted)" }}>{messages.config.modules}</dt>
            <dd className="font-medium">{configuration.moduleIds.length}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={exploreHref} className="tri-btn tri-btn-primary !px-3 !py-1.5 text-xs">
            {messages.explore.enterDemo}
          </Link>
          <Link to="/project-builder" className="tri-btn tri-btn-ghost !px-3 !py-1.5 text-xs">
            {messages.config.generateRequirements}
          </Link>
        </div>
      </div>
    </aside>
  );
}
