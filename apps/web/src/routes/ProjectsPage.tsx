import { useI18n } from "../state/i18n-context";

/**
 * Real project portfolio — clearly distinguished from fictional showroom demos.
 * Content is data-driven; do not fabricate clients, metrics, or results.
 */
const REAL_PROJECTS = [
  {
    slug: "snap",
    category: { en: "Software Development", es: "Desarrollo de software" },
    title: { en: "SNAP", es: "SNAP" },
    status: { en: "Selected work — details forthcoming", es: "Trabajo seleccionado — detalles próximamente" },
    distinction: { en: "Real project", es: "Proyecto real" },
  },
] as const;

export function ProjectsPage() {
  const { messages, locale } = useI18n();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-6">
      <h1 className="font-display text-4xl">{messages.home.projectsHeading}</h1>
      <p className="mt-3 max-w-2xl" style={{ color: "var(--tri-muted)" }}>
        {messages.home.projectsSupport}
      </p>
      <ul className="mt-10 space-y-6">
        {REAL_PROJECTS.map((project) => (
          <li
            key={project.slug}
            className="border-t pt-6"
            style={{ borderColor: "var(--tri-border)" }}
          >
            <span
              className="text-xs uppercase tracking-[0.18em]"
              style={{ color: "var(--tri-accent)" }}
            >
              {project.distinction[locale]}
            </span>
            <h2 className="mt-2 font-display text-2xl">{project.title[locale]}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--tri-muted)" }}>
              {project.category[locale]}
            </p>
            <p className="mt-3 text-sm">{project.status[locale]}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
