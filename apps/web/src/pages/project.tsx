import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SiteFooter, SiteHeader } from "../components/chrome";
import { ProjectGallery } from "../components/projects";
import { getProject } from "../content/projects";
import { useLocale } from "../lib/locale";
import { NotFoundPage } from "./privacy";

export function ProjectPage() {
  const { slug = "" } = useParams();
  const project = getProject(slug);
  const { t, locale } = useLocale();
  const [visualIndex, setVisualIndex] = useState<number | null>(null);

  const coverIndex = useMemo(() => {
    if (!project) return 0;
    const match = project.shots.findIndex((shot) => shot.src === project.cover);
    return match >= 0 ? match : 0;
  }, [project]);

  if (!project) return <NotFoundPage />;

  return (
    <div>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-page px-4 pb-6 pt-8 md:px-8">
          <Link to="/#work" className="text-sm font-semibold text-[var(--accent)] no-underline">
            ← {t("project.back")}
          </Link>
          <p className="section-kicker mt-6">{t("project.eyebrow")}</p>
          <p className="mt-3 text-sm uppercase tracking-[0.14em] text-[var(--muted)]">
            {project.category[locale]}
          </p>
          <h1 className="mt-3 max-w-4xl font-serif text-[clamp(2.2rem,5vw,4rem)] leading-[1.05]">
            {project.headline[locale]}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-[var(--muted)]">{project.summary[locale]}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="btn" href={project.website} target="_blank" rel="noreferrer">
              {t("project.visit")}
            </a>
            <Link className="btn-quiet" to="/inquiry">
              {t("home.inquiryCta")}
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-page px-4 md:px-8">
          <button
            type="button"
            className="preview-frame visual-tile w-full text-left"
            aria-label={`${t("project.openVisual")}: ${project.client}`}
            onClick={() => setVisualIndex(coverIndex)}
          >
            <img
              src={project.cover}
              alt={project.client}
              className="h-full w-full object-cover object-top"
              onError={(event) => {
                event.currentTarget.src =
                  project.slug === "kidstore"
                    ? "/projects/kidstore/og.png"
                    : "/projects/licita-agent/og.png";
              }}
            />
            <span className="preview-frame__caption">
              {project.client} · {project.category[locale]}
            </span>
          </button>
        </section>

        <section className="section mx-auto max-w-page px-4 pt-10 md:px-8">
          <h2 className="section-title">{t("project.gallery")}</h2>
          <p className="section-lead">{t("project.openVisual")}</p>
          <div className="mt-8">
            <ProjectGallery
              project={project}
              activeIndex={visualIndex}
              onActiveChange={setVisualIndex}
            />
          </div>
        </section>

        <section className="section mx-auto grid max-w-page gap-8 px-4 md:grid-cols-2 md:px-8">
          <article className="panel-elevated p-6">
            <h2 className="font-serif text-3xl">{t("project.challenge")}</h2>
            <p className="mt-3 text-[var(--muted)]">{project.challenge[locale]}</p>
          </article>
          <article className="panel-elevated p-6">
            <h2 className="font-serif text-3xl">{t("project.solution")}</h2>
            <p className="mt-3 text-[var(--muted)]">{project.solution[locale]}</p>
          </article>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--surface)]">
          <div className="section mx-auto max-w-page px-4 md:px-8">
            <h2 className="section-title">{t("project.contribution")}</h2>
            <p className="section-lead">{project.overview[locale]}</p>
            <ul className="mt-8 grid gap-3 md:grid-cols-2">
              {project.contributions.map((item) => (
                <li key={item.en} className="capability-item">
                  {item[locale]}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section mx-auto max-w-page px-4 md:px-8">
          <h2 className="section-title">{t("project.capabilities")}</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {project.capabilities.map((item) => (
              <article key={item.en} className="panel p-5">
                <p>{item[locale]}</p>
              </article>
            ))}
          </div>
          {project.technologies.length ? (
            <div className="mt-8">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                {t("project.tech")}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span key={tech} className="badge">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="section mx-auto max-w-page px-4 md:px-8">
          <h2 className="section-title">{t("project.impact")}</h2>
          <p className="mt-4 max-w-3xl text-lg">{project.impact[locale]}</p>
          {project.impactNote ? (
            <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">{project.impactNote[locale]}</p>
          ) : null}
          {project.testimonial ? (
            <figure className="panel-elevated mt-8 max-w-3xl p-6">
              <p className="section-kicker">{t("project.clientReview")}</p>
              <blockquote className="mt-4 font-serif text-2xl leading-snug">
                “{project.testimonial.quote[locale]}”
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-[var(--muted)]">
                — {project.testimonial.attribution}
              </figcaption>
            </figure>
          ) : null}
        </section>

        <section className="mx-auto max-w-page px-4 pb-16 md:px-8">
          <div className="cta-band">
            <h2 className="font-serif text-4xl">{t("project.ctaTitle")}</h2>
            <p className="mt-3 max-w-2xl opacity-85">{t("project.ctaLead")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn-accent" to="/inquiry">
                {t("home.inquiryCta")}
              </Link>
              <a className="btn-quiet" href={project.website} target="_blank" rel="noreferrer">
                {project.websiteLabel[locale]}
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
