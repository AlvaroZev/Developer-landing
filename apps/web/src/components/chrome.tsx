import { useState } from "react";
import { Link } from "react-router-dom";
import { analyticsChoice, setAnalytics } from "../lib/analytics";
import { useLocale } from "../lib/locale";
import { useSession } from "../lib/session";
import { useTheme } from "../lib/theme";
import { Wordmark } from "./brand";

export function SiteHeader() {
  const { t, locale, setLocale } = useLocale();
  const { mode, toggle } = useTheme();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const links = (
    <>
      <a href="/#work">{t("nav.work")}</a>
      <a href="/#capabilities">{t("nav.capability")}</a>
      <Link to="/inquiry">{t("nav.inquiry")}</Link>
      {user?.role === "admin" ? <Link to="/admin">{t("nav.admin")}</Link> : null}
      {user ? (
        <Link to="/account">{t("nav.account")}</Link>
      ) : (
        <Link to="/login">{t("nav.signIn")}</Link>
      )}
    </>
  );
  return (
    <header className="site-header flex h-16 items-center justify-between gap-4 px-4 md:px-8">
      <Link to="/" aria-label={t("brand.name")}>
        <Wordmark />
      </Link>
      <nav className="hidden items-center gap-5 text-sm font-medium md:flex" aria-label="Primary">
        {links}
      </nav>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-quiet min-h-9 px-3"
          onClick={() => setLocale(locale === "en" ? "es" : "en")}
        >
          {locale === "en" ? "ES" : "EN"}
        </button>
        <button type="button" className="btn-quiet min-h-9 px-3" onClick={toggle}>
          {mode === "dark" ? t("nav.light") : t("nav.dark")}
        </button>
        <button
          type="button"
          className="btn-quiet min-h-9 px-3 md:hidden"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {t("nav.menu")}
        </button>
      </div>
      {open ? (
        <nav
          className="absolute left-0 right-0 top-16 z-30 grid gap-3 border-b border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-md)] md:hidden"
          aria-label="Mobile"
        >
          {links}
        </nav>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <p className="font-serif text-3xl text-[var(--text)]">Triunder</p>
          <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">{t("footer.tagline")}</p>
          <p className="mt-4 max-w-sm text-sm text-[var(--muted)]">{t("footer.note")}</p>
        </div>

        <div>
          <p className="site-footer__label">{t("footer.contact")}</p>
          <ul className="mt-3 grid gap-2 text-sm">
            <li>
              <a className="site-footer__link" href="mailto:centralextraartificial@gmail.com">
                {t("footer.email")}
                <span>centralextraartificial@gmail.com</span>
              </a>
            </li>
            <li>
              <a
                className="site-footer__link"
                href="https://wa.me/AlvaroZev"
                target="_blank"
                rel="noreferrer"
              >
                {t("footer.whatsapp")}
                <span>@AlvaroZev</span>
              </a>
            </li>
            <li>
              <a
                className="site-footer__link"
                href="https://github.com/AlvaroZev"
                target="_blank"
                rel="noreferrer"
              >
                {t("footer.github")}
                <span>AlvaroZev</span>
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="site-footer__label">{t("footer.languages")}</p>
          <p className="mt-3 max-w-xs text-sm text-[var(--muted)]">{t("footer.languagesLead")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="badge">EN</span>
            <span className="badge">ES</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link className="font-semibold text-[var(--accent)] no-underline" to="/inquiry">
              {t("footer.inquiry")}
            </Link>
            <Link className="text-[var(--muted)] no-underline hover:text-[var(--text)]" to="/privacy">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </div>
      <p className="site-footer__legal">{t("footer.rights")}</p>
    </footer>
  );
}

export function ConsentBanner() {
  const { t } = useLocale();
  const [choice, setChoice] = useState(analyticsChoice);
  if (choice) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-lg)] md:inset-x-auto">
      <p className="text-sm text-[var(--muted)]">{t("consent.body")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn"
          onClick={() => {
            setAnalytics(true);
            setChoice("yes");
          }}
        >
          {t("consent.accept")}
        </button>
        <button
          type="button"
          className="btn-quiet"
          onClick={() => {
            setAnalytics(false);
            setChoice("no");
          }}
        >
          {t("consent.decline")}
        </button>
      </div>
    </div>
  );
}
