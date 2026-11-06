import { useI18n } from "../../state/i18n-context";

const CAPABILITIES = {
  en: [
    "Full-stack software",
    "Backend & distributed systems",
    "AI & RAG integrations",
    "Industrial IoT & telemetry",
    "Embedded systems",
    "Robotics & control",
    "Automation",
    "Cloud deployment",
  ],
  es: [
    "Software full-stack",
    "Backend y sistemas distribuidos",
    "Integraciones de IA y RAG",
    "IoT industrial y telemetría",
    "Sistemas embebidos",
    "Robótica y control",
    "Automatización",
    "Despliegue en la nube",
  ],
} as const;

export function CapabilitiesStrip() {
  const { messages, locale } = useI18n();
  const items = CAPABILITIES[locale];

  return (
    <section className="tri-container py-16 md:py-20">
      <h2 className="tri-section-title">{messages.home.capabilitiesHeading}</h2>
      <p className="tri-lede mt-3">{messages.home.capabilitiesSupport}</p>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item} className="tri-card px-5 py-4 text-sm font-medium tracking-[-0.01em]">
            <span
              className="mb-3 block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--tri-accent)" }}
            />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
