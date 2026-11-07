import type { Inquiry, Profile } from "@triunder/contracts";
import { getIndustry } from "@triunder/industry-registry";
import { getSolution } from "@triunder/solution-registry";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/chrome";
import { Field } from "../components/ui";
import { useLocale } from "../lib/locale";
import { client, useSession } from "../lib/session";

interface SavedDemo {
  id: string;
  industrySlug: string;
  solutionSlug: string;
}
interface DemoSession {
  id: string;
  industrySlug: string;
  solutionSlug: string;
  updatedAt: string;
}

export function AccountPage() {
  const { t, locale } = useLocale();
  const { user, profile, loading, logout, refresh } = useSession();
  const navigate = useNavigate();
  const [section, setSection] = useState("overview");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [saved, setSaved] = useState<SavedDemo[]>([]);
  const [sessions, setSessions] = useState<DemoSession[]>([]);
  const [draft, setDraft] = useState<Profile | null>(profile);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    setDraft(profile);
    if (!user) return;
    void client
      .request<{ inquiries: Inquiry[] }>("/api/v1/inquiries")
      .then((result) => setInquiries(result.inquiries))
      .catch(() => undefined);
    void client
      .request<{ saved: SavedDemo[] }>("/api/v1/configurations")
      .then((result) => setSaved(result.saved))
      .catch(() => undefined);
    void client
      .request<{ sessions: DemoSession[] }>("/api/v1/demo-sessions")
      .then((result) => setSessions(result.sessions))
      .catch(() => undefined);
  }, [user, profile]);

  if (!user || !draft) return <main className="p-8">{t("common.loading")}</main>;

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-page gap-6 px-4 py-8 md:grid-cols-[14rem_1fr]">
        <nav className="grid gap-1">
          {(["overview", "saved", "sessions", "inquiries", "profile"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className="nav-item"
              aria-current={section === item ? "page" : undefined}
              onClick={() => setSection(item)}
            >
              {t(`account.${item}`)}
            </button>
          ))}
          <button
            type="button"
            className="btn-quiet"
            onClick={() => {
              void logout().then(() => navigate("/"));
            }}
          >
            {t("auth.signOut")}
          </button>
        </nav>
        <section>
          <h1 className="font-serif text-4xl">{t("account.title")}</h1>
          {message ? (
            <p className="mt-2 text-sm" role="status">
              {message}
            </p>
          ) : null}
          {section === "overview" ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <article className="kpi">
                <p>{t("account.saved")}</p>
                <strong className="font-serif text-3xl">{saved.length}</strong>
              </article>
              <article className="kpi">
                <p>{t("account.sessions")}</p>
                <strong className="font-serif text-3xl">{sessions.length}</strong>
              </article>
              <article className="kpi">
                <p>{t("account.inquiries")}</p>
                <strong className="font-serif text-3xl">{inquiries.length}</strong>
              </article>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  void client
                    .request("/api/v1/guest-sessions/migrate", { method: "POST" })
                    .then(async () => {
                      setMessage(t("account.attached"));
                      await refresh();
                    });
                }}
              >
                {t("account.attach")}
              </button>
            </div>
          ) : null}
          {section === "saved" ? (
            <List
              empty={t("account.emptySaved")}
              rows={saved.map((item) => ({
                id: item.id,
                href: `/explore/${item.industrySlug}/${item.solutionSlug}`,
                title: `${getIndustry(item.industrySlug)?.name[locale] ?? item.industrySlug} · ${getSolution(item.solutionSlug)?.name[locale] ?? item.solutionSlug}`,
              }))}
            />
          ) : null}
          {section === "sessions" ? (
            <List
              empty={t("account.emptySessions")}
              rows={sessions.map((item) => ({
                id: item.id,
                href: `/explore/${item.industrySlug}/${item.solutionSlug}`,
                title: `${item.industrySlug} / ${item.solutionSlug}`,
              }))}
            />
          ) : null}
          {section === "inquiries" ? (
            inquiries.length === 0 ? (
              <p className="mt-6">{t("account.emptyInquiries")}</p>
            ) : (
              <ul className="mt-6 grid gap-3">
                {inquiries.map((item) => (
                  <li key={item.id} className="panel p-4">
                    <p className="text-sm text-[var(--muted)]">
                      {t(`status.${item.status}`)} · {item.industrySlug}
                    </p>
                    <p className="mt-2">{item.problem}</p>
                  </li>
                ))}
              </ul>
            )
          ) : null}
          {section === "profile" ? (
            <form
              className="mt-6 grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void client
                  .request("/api/v1/profiles/me", { method: "PUT", body: JSON.stringify(draft) })
                  .then(async () => {
                    setMessage(t("account.savedProfile"));
                    await refresh();
                  });
              }}
            >
              {(Object.keys(draft) as (keyof Profile)[]).map((key) => (
                <Field
                  key={key}
                  label={
                    key === "preferredLanguage"
                      ? t("profile.language")
                      : t(`profile.${key}` as "profile.firstName")
                  }
                >
                  {key === "description" ? (
                    <textarea
                      value={draft[key]}
                      onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                    />
                  ) : key === "preferredLanguage" ? (
                    <select
                      value={draft.preferredLanguage}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          preferredLanguage: event.target.value === "es" ? "es" : "en",
                        })
                      }
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  ) : (
                    <input
                      value={draft[key]}
                      onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                    />
                  )}
                </Field>
              ))}
              <button className="btn" type="submit">
                {t("account.saveProfile")}
              </button>
            </form>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function List({
  rows,
  empty,
}: { rows: { id: string; href: string; title: string }[]; empty: string }) {
  const { t } = useLocale();
  if (!rows.length) return <p className="mt-6">{empty}</p>;
  return (
    <ul className="mt-6 grid gap-3">
      {rows.map((row) => (
        <li key={row.id} className="panel flex items-center justify-between p-4">
          <span>{row.title}</span>
          <Link to={row.href}>{t("account.resume")}</Link>
        </li>
      ))}
    </ul>
  );
}
