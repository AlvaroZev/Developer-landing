import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { type ProjectCase, type ProjectShot, projects } from "../content/projects";
import { useLocale } from "../lib/locale";

function ShotImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(event) => {
        const image = event.currentTarget;
        if (image.dataset.fallback === "1") return;
        image.dataset.fallback = "1";
        if (src.includes("kidstore")) image.src = "/projects/kidstore/og.png";
        else if (src.includes("licita")) image.src = "/projects/licita-agent/og.png";
      }}
    />
  );
}

export function ProjectCard({ project }: { project: ProjectCase }) {
  const { t, locale } = useLocale();
  return (
    <article className="project-card">
      <Link to={`/projects/${project.slug}`} className="no-underline text-inherit">
        <div className="project-card__media">
          <ShotImage src={project.cover} alt={project.headline[locale]} />
        </div>
        <div className="project-card__body">
          <p className="section-kicker">{project.category[locale]}</p>
          <h3 className="mt-2 font-serif text-3xl leading-tight">{project.client}</h3>
          <p className="mt-3 text-[var(--muted)]">{project.headline[locale]}</p>
          <p className="mt-4 text-sm text-[var(--muted)]">{project.summary[locale]}</p>
          <span className="mt-5 inline-flex font-semibold text-[var(--accent)]">
            {t("home.viewCase")} →
          </span>
        </div>
      </Link>
    </article>
  );
}

export function SelectedWorkSection() {
  const { t } = useLocale();
  const featured = projects.filter((project) => project.featured);
  return (
    <section
      id="work"
      className="section mx-auto max-w-page px-4 md:px-8"
      aria-labelledby="work-title"
    >
      <p className="section-kicker">{t("home.cases")}</p>
      <h2 id="work-title" className="section-title">
        {t("home.cases")}
      </h2>
      <p className="section-lead">{t("home.casesLead")}</p>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {featured.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  );
}

function VisualLightbox({
  shots,
  index,
  onClose,
  onChange,
}: {
  shots: ProjectShot[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
}) {
  const { t, locale } = useLocale();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const shot = shots[index] ?? shots[0];

  useEffect(() => {
    if (!shot) return;
    const previously = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onChange((index + 1) % shots.length);
      if (event.key === "ArrowLeft") onChange((index - 1 + shots.length) % shots.length);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      previously?.focus();
    };
  }, [index, onChange, onClose, shot, shots.length]);

  if (!shot) return null;

  return createPortal(
    <div className="visual-lightbox" role="presentation">
      <button
        type="button"
        className="visual-lightbox__backdrop"
        aria-label={t("project.closeVisual")}
        onClick={onClose}
      />
      <div
        className="visual-lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="visual-lightbox__chrome">
          <div>
            <p className="section-kicker">
              {shot.kind === "illustration"
                ? t("project.illustrationNote")
                : t("project.screenshotNote")}
            </p>
            <h2 id={titleId} className="mt-1 font-serif text-2xl md:text-3xl">
              {shot.alt[locale]}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="btn-quiet"
            aria-label={t("project.closeVisual")}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="visual-lightbox__stage">
          {shots.length > 1 ? (
            <button
              type="button"
              className="visual-lightbox__nav is-prev"
              aria-label={t("project.previousVisual")}
              onClick={() => onChange((index - 1 + shots.length) % shots.length)}
            >
              ‹
            </button>
          ) : null}
          <ShotImage src={shot.src} alt={shot.alt[locale]} className="visual-lightbox__image" />
          {shots.length > 1 ? (
            <button
              type="button"
              className="visual-lightbox__nav is-next"
              aria-label={t("project.nextVisual")}
              onClick={() => onChange((index + 1) % shots.length)}
            >
              ›
            </button>
          ) : null}
        </div>

        <div className="visual-lightbox__meta">
          <p>{shot.caption[locale]}</p>
          <p className="text-sm text-[var(--muted)]">
            {t("project.visualOf", { current: index + 1, total: shots.length })}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ProjectGallery({
  project,
  activeIndex,
  onActiveChange,
}: {
  project: ProjectCase;
  activeIndex: number | null;
  onActiveChange: (index: number | null) => void;
}) {
  const { t, locale } = useLocale();

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        {project.shots.map((shot, index) => (
          <button
            key={shot.src}
            type="button"
            className="visual-tile panel overflow-hidden text-left"
            aria-label={`${t("project.openVisual")}: ${shot.alt[locale]}`}
            onClick={() => onActiveChange(index)}
          >
            <ShotImage
              src={shot.src}
              alt={shot.alt[locale]}
              className="aspect-[16/10] w-full object-cover object-top"
            />
            <span className="visual-tile__caption space-y-1 p-4 text-sm text-[var(--muted)]">
              <span className="badge">
                {shot.kind === "illustration"
                  ? t("project.illustrationNote")
                  : t("project.screenshotNote")}
              </span>
              <span className="block">{shot.caption[locale]}</span>
            </span>
          </button>
        ))}
      </div>
      {activeIndex !== null ? (
        <VisualLightbox
          shots={project.shots}
          index={activeIndex}
          onClose={() => onActiveChange(null)}
          onChange={onActiveChange}
        />
      ) : null}
    </>
  );
}
