import { Link } from "react-router-dom";
import { TriunderMark } from "../brand/TriunderMark";
import { useI18n } from "../../state/i18n-context";

export function SiteFooter() {
  const { messages } = useI18n();

  return (
    <footer className="mt-auto border-t" style={{ borderColor: "var(--tri-border)" }}>
      <div className="tri-container flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <TriunderMark size={28} />
            <span className="text-lg font-semibold tracking-[-0.03em]">Triunder</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--tri-muted)" }}>
            {messages.brand.tagline}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm" style={{ color: "var(--tri-muted)" }}>
          <Link className="hover:text-[var(--tri-text)]" to="/explore">
            {messages.nav.explore}
          </Link>
          <Link className="hover:text-[var(--tri-text)]" to="/projects">
            {messages.nav.projects}
          </Link>
          <Link className="hover:text-[var(--tri-text)]" to="/project-builder">
            {messages.nav.builder}
          </Link>
          <Link className="hover:text-[var(--tri-text)]" to="/contact">
            {messages.nav.contact}
          </Link>
        </div>

        <p className="text-xs" style={{ color: "var(--tri-muted)" }}>
          © {new Date().getFullYear()} Triunder
        </p>
      </div>
    </footer>
  );
}
