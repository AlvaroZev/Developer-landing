import { Link } from "react-router-dom";
import { useI18n } from "../../state/i18n-context";

const FEATURED = [
  {
    industrySlug: "healthcare",
    solutionSlug: "crm",
    en: { title: "Healthcare CRM", blurb: "Patients, appointments, follow-ups." },
    es: { title: "CRM de salud", blurb: "Pacientes, citas y seguimientos." },
  },
  {
    industrySlug: "retail",
    solutionSlug: "ecommerce",
    en: { title: "Retail E-commerce", blurb: "Catalog, cart, simulated checkout." },
    es: { title: "E-commerce retail", blurb: "Catálogo, carrito y checkout simulado." },
  },
  {
    industrySlug: "manufacturing",
    solutionSlug: "mes",
    en: { title: "Manufacturing MES", blurb: "Lines, work orders, downtime." },
    es: { title: "MES de manufactura", blurb: "Líneas, órdenes y paradas." },
  },
  {
    industrySlug: "logistics",
    solutionSlug: "fleet",
    en: { title: "Fleet Management", blurb: "Vehicles, shipments, tracking." },
    es: { title: "Gestión de flota", blurb: "Vehículos, envíos y seguimiento." },
  },
  {
    industrySlug: "real-estate",
    solutionSlug: "crm",
    en: { title: "Real Estate CRM", blurb: "Leads, properties, pipeline." },
    es: { title: "CRM inmobiliario", blurb: "Prospectos, propiedades y embudo." },
  },
  {
    industrySlug: "agriculture",
    solutionSlug: "iot",
    en: { title: "Agriculture IoT", blurb: "Sensors, thresholds, irrigation." },
    es: { title: "IoT agrícola", blurb: "Sensores, umbrales y riego." },
  },
] as const;

export function FeaturedDemos() {
  const { messages, locale } = useI18n();

  return (
    <section className="relative py-16 md:py-20">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent, color-mix(in srgb, var(--tri-surface) 55%, transparent), transparent)",
        }}
      />
      <div className="tri-container relative">
        <h2 className="tri-section-title">{messages.home.featuredHeading}</h2>
        <p className="tri-lede mt-3">{messages.home.featuredSupport}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((demo) => {
            const copy = demo[locale];
            return (
              <Link
                key={`${demo.industrySlug}-${demo.solutionSlug}`}
                to={`/explore/${demo.industrySlug}/${demo.solutionSlug}?level=professional`}
                className="tri-card group relative overflow-hidden p-6"
              >
                <div
                  className="absolute inset-x-0 top-0 h-px opacity-80"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, var(--tri-accent), transparent)",
                  }}
                />
                <h3 className="text-lg font-semibold tracking-[-0.02em]">{copy.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--tri-muted)" }}>
                  {copy.blurb}
                </p>
                <span
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium transition-transform group-hover:translate-x-0.5"
                  style={{ color: "var(--tri-accent)" }}
                >
                  {messages.explore.enterDemo}
                  <span aria-hidden>→</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
