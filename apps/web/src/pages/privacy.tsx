import { SiteFooter, SiteHeader } from "../components/chrome";
import { useLocale } from "../lib/locale";

export function PrivacyPage() {
  const { t } = useLocale();
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-serif text-4xl">{t("privacy.title")}</h1>
        <p className="mt-4 leading-7 text-[var(--muted)]">{t("privacy.body")}</p>
      </main>
      <SiteFooter />
    </div>
  );
}

export function NotFoundPage() {
  const { t } = useLocale();
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <h1 className="font-serif text-4xl">{t("errors.notFound")}</h1>
        <a className="btn mt-6" href="/">
          {t("demo.backHome")}
        </a>
      </div>
    </main>
  );
}
