import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { TriunderMark, TriunderWordmark } from "../brand/TriunderMark";
import { useI18n } from "../../state/i18n-context";
import { useThemeMode } from "../../state/theme-context";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm transition-colors ${
    isActive
      ? "bg-[color-mix(in_srgb,var(--tri-accent)_16%,transparent)] text-[var(--tri-text)]"
      : "text-[var(--tri-muted)] hover:text-[var(--tri-text)]"
  }`;

export function SiteHeader() {
  const { messages, locale, setLocale } = useI18n();
  const { colorMode, setColorMode } = useThemeMode();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-4 md:px-4">
      <div
        className="pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full border px-3 py-2 shadow-[var(--shadow-nav)] backdrop-blur-xl md:px-4"
        style={{
          background: "color-mix(in srgb, var(--tri-surface) 78%, transparent)",
          borderColor: "color-mix(in srgb, var(--tri-border) 85%, transparent)",
        }}
      >
        <Link to="/" className="flex items-center gap-2.5 pl-1" aria-label="Triunder home">
          <TriunderMark size={28} />
          <TriunderWordmark className="hidden text-lg sm:inline" />
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
          <NavLink to="/explore" className={linkClass}>
            {messages.nav.explore}
          </NavLink>
          <NavLink to="/projects" className={linkClass}>
            {messages.nav.projects}
          </NavLink>
          <NavLink to="/project-builder" className={linkClass}>
            {messages.nav.builder}
          </NavLink>
          <NavLink to="/contact" className={linkClass}>
            {messages.nav.contact}
          </NavLink>
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="rounded-full px-2.5 py-1.5 text-xs font-medium"
            style={{ color: "var(--tri-muted)" }}
            onClick={() => setLocale(locale === "en" ? "es" : "en")}
            aria-label={messages.common.language}
          >
            {locale === "en" ? "ES" : "EN"}
          </button>
          <button
            type="button"
            className="rounded-full px-2.5 py-1.5 text-xs font-medium"
            style={{ color: "var(--tri-muted)" }}
            onClick={() => setColorMode(colorMode === "light" ? "dark" : "light")}
            aria-label={messages.common.theme}
          >
            {colorMode === "light" ? "☾" : "☀"}
          </button>
          <Link to="/contact" className="tri-btn tri-btn-primary hidden sm:inline-flex">
            {messages.config.requestConsultation}
            <span aria-hidden>↗</span>
          </Link>
          <button
            type="button"
            className="rounded-full border px-3 py-1.5 text-xs md:hidden"
            style={{ borderColor: "var(--tri-border)" }}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Menu"
          >
            Menu
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="pointer-events-auto mx-auto mt-2 flex max-w-5xl flex-col gap-1 rounded-2xl border p-3 backdrop-blur-xl md:hidden"
          style={{
            background: "color-mix(in srgb, var(--tri-surface) 92%, transparent)",
            borderColor: "var(--tri-border)",
          }}
        >
          {[
            ["/explore", messages.nav.explore],
            ["/projects", messages.nav.projects],
            ["/project-builder", messages.nav.builder],
            ["/contact", messages.nav.contact],
          ].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className="rounded-xl px-3 py-2 text-sm"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
