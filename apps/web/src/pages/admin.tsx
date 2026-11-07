import type { Inquiry, PlatformConfig } from "@triunder/contracts";
import { caseStudies, industries } from "@triunder/industry-registry";
import { allCompatiblePairs, solutions } from "@triunder/solution-registry";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/chrome";
import { Field } from "../components/ui";
import { useLocale } from "../lib/locale";
import { client, useSession } from "../lib/session";

type AdminInquiry = Inquiry & { notes?: { id: string; body: string }[] };

interface Flags {
  aiEnabled: boolean;
  projectDescription: boolean;
  requirementsAssistance: boolean;
  hiddenCaseStudies: string[];
}

interface Summary {
  visitors: number;
  registrations: number;
  inquiries: number;
  conversion: number;
  industries: { name: string; count: number }[];
  solutions: { name: string; count: number }[];
  funnel: { event: string; count: number }[];
}

export function AdminPage() {
  const { t } = useLocale();
  const { user, loading, config, refresh } = useSession();
  const navigate = useNavigate();
  const [section, setSection] = useState("inquiries");
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [status, setStatus] = useState("");
  const [industry, setIndustry] = useState("");
  const [solution, setSolution] = useState("");
  const [flags, setFlags] = useState<Flags>({
    aiEnabled: true,
    projectDescription: true,
    requirementsAssistance: false,
    hiddenCaseStudies: [],
  });
  const [users, setUsers] = useState<{ id: string; email: string; role: string }[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [integration, setIntegration] = useState<
    (PlatformConfig["ai"] & { lastCheck?: string; lastError?: string }) | null
  >(null);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (!loading && user?.role !== "admin") navigate("/");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (industry) query.set("industry", industry);
    if (solution) query.set("solution", solution);
    void client
      .request<{ inquiries: AdminInquiry[] }>(`/api/v1/admin/inquiries?${query}`)
      .then((result) => setInquiries(result.inquiries))
      .catch(() => undefined);
    void client
      .request<{ users: { id: string; email: string; role: string }[] }>("/api/v1/admin/users")
      .then((result) => setUsers(result.users))
      .catch(() => undefined);
    void client
      .request<Summary>("/api/v1/admin/analytics")
      .then(setSummary)
      .catch(() => undefined);
    void client
      .request<PlatformConfig["ai"] & { lastCheck?: string; lastError?: string }>(
        "/api/v1/admin/integrations/openai",
      )
      .then(setIntegration)
      .catch(() => undefined);
    void client
      .request<Flags>("/api/v1/admin/settings")
      .then(setFlags)
      .catch(() => undefined);
  }, [user, status, industry, solution]);

  if (user?.role !== "admin") return null;
  const sections = [
    "inquiries",
    "users",
    "catalog",
    "analytics",
    "integrations",
    "settings",
  ] as const;

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-page gap-6 px-4 py-8 lg:grid-cols-[15rem_1fr]">
        <nav className="grid gap-1">
          {sections.map((item) => (
            <button
              key={item}
              type="button"
              className="nav-item"
              aria-current={section === item ? "page" : undefined}
              onClick={() => setSection(item)}
            >
              {t(
                `admin.${item === "integrations" ? "integrations" : item === "settings" ? "settings" : item}`,
              )}
            </button>
          ))}
        </nav>
        <section>
          <h1 className="font-serif text-4xl">{t("admin.title")}</h1>
          {section === "inquiries" ? (
            <div className="mt-4">
              <div className="mb-3 grid gap-2 md:grid-cols-3">
                <Field label={t("account.status")}>
                  <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">{t("demo.all")}</option>
                    {["submitted", "in_discussion", "completed", "archived", "draft"].map(
                      (item) => (
                        <option key={item} value={item}>
                          {t(`status.${item}` as "status.draft")}
                        </option>
                      ),
                    )}
                  </select>
                </Field>
                <Field label={t("home.industry")}>
                  <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
                    <option value="">{t("demo.all")}</option>
                    {industries.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.name.en}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("home.solution")}>
                  <select value={solution} onChange={(event) => setSolution(event.target.value)}>
                    <option value="">{t("demo.all")}</option>
                    {solutions.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.name.en}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <ul className="grid gap-3">
                {inquiries.map((item) => (
                  <li key={item.id} className="panel p-4">
                    <p className="text-sm text-[var(--muted)]">
                      {item.email} · {item.industrySlug} · {item.solutionSlug}
                    </p>
                    <p className="mt-2">{item.problem}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <select
                        aria-label={t("admin.updateStatus")}
                        defaultValue={item.status}
                        onChange={(event) => {
                          void client.request(`/api/v1/admin/inquiries/${item.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ status: event.target.value }),
                          });
                        }}
                      >
                        {["draft", "submitted", "in_discussion", "completed", "archived"].map(
                          (value) => (
                            <option key={value} value={value}>
                              {t(`status.${value}` as "status.draft")}
                            </option>
                          ),
                        )}
                      </select>
                      <button
                        type="button"
                        className="btn-quiet"
                        onClick={() => setSelected(item.id)}
                      >
                        {t("admin.note")}
                      </button>
                    </div>
                    {item.notes?.map((entry) => (
                      <p key={entry.id} className="mt-2 text-sm text-[var(--muted)]">
                        {entry.body}
                      </p>
                    ))}
                    {selected === item.id ? (
                      <form
                        className="mt-3 grid gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void client
                            .request(`/api/v1/admin/inquiries/${item.id}/notes`, {
                              method: "POST",
                              body: JSON.stringify({ body: note }),
                            })
                            .then(() => {
                              setNote("");
                              setSelected("");
                            });
                        }}
                      >
                        <textarea value={note} onChange={(event) => setNote(event.target.value)} />
                        <button className="btn w-fit" type="submit">
                          {t("admin.addNote")}
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {section === "users" ? (
            <ul className="mt-4 grid gap-2">
              {users.map((item) => (
                <li key={item.id} className="panel flex items-center justify-between p-3">
                  <span>{item.email}</span>
                  <button
                    type="button"
                    className="btn-quiet"
                    onClick={() => {
                      void client
                        .request(`/api/v1/admin/users/${item.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ role: item.role === "admin" ? "user" : "admin" }),
                        })
                        .then(() => refresh());
                    }}
                  >
                    {item.role === "admin" ? t("admin.makeUser") : t("admin.makeAdmin")}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {section === "catalog" ? (
            <div className="mt-4">
              <p className="text-sm text-[var(--muted)]">
                {industries.length} · {solutions.length} · {allCompatiblePairs().length}
              </p>
              <h2 className="mt-6 font-serif text-2xl">{t("admin.featured")}</h2>
              <ul className="mt-3 grid gap-2">
                {caseStudies.map((item) => {
                  const hidden = flags.hiddenCaseStudies.includes(item.id);
                  return (
                    <li key={item.id} className="panel flex items-center justify-between gap-3 p-3">
                      <span>{item.client.en}</span>
                      <button
                        type="button"
                        className="btn-quiet"
                        onClick={() => {
                          const hiddenCaseStudies = hidden
                            ? flags.hiddenCaseStudies.filter((id) => id !== item.id)
                            : [...flags.hiddenCaseStudies, item.id];
                          const next = { ...flags, hiddenCaseStudies };
                          setFlags(next);
                          void client.request("/api/v1/admin/settings", {
                            method: "PUT",
                            body: JSON.stringify(next),
                          });
                        }}
                      >
                        {hidden ? t("admin.showCase") : t("admin.hideCase")}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <ul className="mt-4 grid gap-2 md:grid-cols-2">
                {industries
                  .filter((item) => item.slug !== "custom")
                  .map((item) => (
                    <li key={item.slug} className="panel p-3">
                      <strong>{item.name.en}</strong>
                      <p className="text-sm text-[var(--muted)]">{item.solutionSlugs.join(", ")}</p>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
          {section === "analytics" && summary ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <article className="panel p-4">
                <p>{t("admin.visitors")}</p>
                <strong className="font-serif text-3xl">{summary.visitors}</strong>
              </article>
              <article className="panel p-4">
                <p>{t("admin.registrations")}</p>
                <strong className="font-serif text-3xl">{summary.registrations}</strong>
              </article>
              <article className="panel p-4">
                <p>{t("admin.inquiryCount")}</p>
                <strong className="font-serif text-3xl">{summary.inquiries}</strong>
              </article>
              <article className="panel p-4">
                <p>{t("admin.conversion")}</p>
                <strong className="font-serif text-3xl">{summary.conversion}</strong>
              </article>
              <article className="panel p-4 sm:col-span-2">
                <h2 className="font-serif text-2xl">{t("admin.funnel")}</h2>
                <ul className="mt-2">
                  {summary.funnel.map((item) => (
                    <li key={item.event}>
                      {item.event}: {item.count}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ) : null}
          {section === "integrations" ? (
            <div className="mt-4 panel p-4">
              {integration?.status === "missing_credentials" ? (
                <p className="mb-3 text-sm">{t("admin.warningKey")}</p>
              ) : null}
              <p>{t("admin.provider")}: OpenAI</p>
              <p>
                {t("admin.model")}: {integration?.model}
              </p>
              <p>
                {t("admin.configStatus")}: {integration?.status}
              </p>
              <p>
                {t("admin.lastCheck")}: {integration?.lastCheck || t("admin.never")}
              </p>
              <p>
                {t("admin.lastError")}: {integration?.lastError || "—"}
              </p>
              <p className="text-sm text-[var(--muted)]">{t("admin.keyHidden")}</p>
              <button
                type="button"
                className="btn mt-3"
                onClick={() => {
                  void client
                    .request("/api/v1/admin/integrations/openai/health", { method: "POST" })
                    .then(() => window.location.reload());
                }}
              >
                {t("admin.check")}
              </button>
            </div>
          ) : null}
          {section === "settings" ? (
            <form
              className="mt-4 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                void client
                  .request("/api/v1/admin/settings", {
                    method: "PUT",
                    body: JSON.stringify({
                      aiEnabled: data.get("aiEnabled") === "on",
                      projectDescription: data.get("projectDescription") === "on",
                      requirementsAssistance: data.get("requirementsAssistance") === "on",
                    }),
                  })
                  .then(() => refresh());
              }}
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="aiEnabled"
                  checked={flags.aiEnabled}
                  onChange={(event) => setFlags({ ...flags, aiEnabled: event.target.checked })}
                />{" "}
                {t("admin.aiMaster")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="projectDescription"
                  checked={flags.projectDescription}
                  onChange={(event) =>
                    setFlags({ ...flags, projectDescription: event.target.checked })
                  }
                />{" "}
                {t("admin.aiDescribe")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="requirementsAssistance"
                  checked={flags.requirementsAssistance}
                  onChange={(event) =>
                    setFlags({ ...flags, requirementsAssistance: event.target.checked })
                  }
                />{" "}
                {t("admin.aiRequirements")}
              </label>
              <button className="btn w-fit" type="submit">
                {t("admin.save")}
              </button>
            </form>
          ) : null}
        </section>
      </main>
      <p className="px-4 pb-8 text-sm">
        <Link to="/">{t("demo.backHome")}</Link>
      </p>
    </div>
  );
}
