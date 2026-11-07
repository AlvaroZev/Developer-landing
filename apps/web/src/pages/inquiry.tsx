import { validateInquiry } from "@triunder/domain";
import { getIndustry, industries } from "@triunder/industry-registry";
import { getSolution, solutionsForIndustry } from "@triunder/solution-registry";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SiteFooter, SiteHeader } from "../components/chrome";
import { Field } from "../components/ui";
import { track } from "../lib/analytics";
import { useLocale } from "../lib/locale";
import { client, useSession } from "../lib/session";

const catalog = {
  industries: industries.map((item) => item.slug),
  compatibility: Object.fromEntries(
    industries.map((item) => [item.slug, [...item.solutionSlugs]]),
  ) as Record<string, string[]>,
};

export function InquiryPage() {
  const { t, locale } = useLocale();
  const { config, user } = useSession();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    industrySlug: params.get("industry") ?? "",
    solutionSlug: params.get("solution") ?? "",
    customIndustry: params.get("custom") ?? "",
    problem: "",
    desired: "",
    details: "",
    name: user?.email ? "" : "",
    email: user?.email ?? "",
    company: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);
  const [assist, setAssist] = useState("");
  const solutions = form.industrySlug ? solutionsForIndustry(form.industrySlug) : [];
  const showAssist = config.ai.features.projectDescription && config.ai.status === "configured";

  const patch = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = validateInquiry(form, catalog);
    if (!result.ok) {
      setErrors(result.fields);
      return;
    }
    setErrors({});
    setBusy(true);
    track("inquiry_started", { industry: form.industrySlug, solution: form.solutionSlug });
    try {
      const saved = await client.request<{ id: string }>("/api/v1/inquiries", {
        method: "POST",
        body: JSON.stringify(result.value),
      });
      setDone(saved.id);
      track("inquiry_submitted", { industry: form.industrySlug, solution: form.solutionSlug });
    } catch {
      setErrors({ form: "offline" });
    } finally {
      setBusy(false);
    }
  }

  async function help() {
    setBusy(true);
    setAssist("");
    try {
      const suggestion = await client.request<{ problem: string; desired: string; notes: string }>(
        "/api/v1/ai/assist",
        {
          method: "POST",
          body: JSON.stringify({
            mode: "describe",
            industrySlug: form.industrySlug || "custom",
            solutionSlug: form.solutionSlug,
            problem: form.problem,
            desired: form.desired,
            locale,
          }),
        },
      );
      setAssist(suggestion.notes);
      setForm((current) => ({
        ...current,
        problem: suggestion.problem,
        desired: suggestion.desired || current.desired,
      }));
    } catch {
      setAssist(t("inquiry.assistUnavailable"));
    } finally {
      setBusy(false);
    }
  }

  const industryName = useMemo(
    () => getIndustry(form.industrySlug)?.name[locale] ?? "",
    [form.industrySlug, locale],
  );

  if (done) {
    return (
      <div>
        <SiteHeader />
        <main className="mx-auto max-w-xl px-4 py-16">
          <h1 className="font-serif text-4xl">{t("inquiry.successTitle")}</h1>
          <p className="mt-3 text-[var(--muted)]">{t("inquiry.successBody")}</p>
          {!user ? (
            <Link className="btn mt-6" to={`/register?inquiry=${done}`}>
              {t("inquiry.createAccount")}
            </Link>
          ) : (
            <Link className="btn mt-6" to="/account">
              {t("nav.account")}
            </Link>
          )}
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="panel-elevated p-6 md:p-8">
        <p className="section-kicker">{t("inquiry.eyebrow")}</p>
        <h1 className="mt-2 font-serif text-4xl">{t("inquiry.title")}</h1>
        <p className="mt-3 text-[var(--muted)]">{t("inquiry.lead")}</p>
        <form className="mt-8 grid gap-4" onSubmit={submit} noValidate>
          <Field label={t("inquiry.industry")} error={errors.industrySlug}>
            <select
              value={form.industrySlug}
              onChange={(event) => patch("industrySlug", event.target.value)}
            >
              <option value="" />
              {industries.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name[locale]}
                </option>
              ))}
            </select>
          </Field>
          {form.industrySlug === "custom" ? (
            <Field label={t("inquiry.custom")} error={errors.customIndustry}>
              <input
                value={form.customIndustry}
                onChange={(event) => patch("customIndustry", event.target.value)}
              />
            </Field>
          ) : (
            <Field label={t("inquiry.solution")} error={errors.solutionSlug}>
              <select
                value={form.solutionSlug}
                onChange={(event) => patch("solutionSlug", event.target.value)}
              >
                <option value="" />
                {solutions.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name[locale]}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label={t("inquiry.problem")} error={errors.problem}>
            <textarea
              value={form.problem}
              onChange={(event) => patch("problem", event.target.value)}
            />
          </Field>
          {showAssist ? (
            <div>
              <button
                type="button"
                className="btn-quiet"
                onClick={() => void help()}
                disabled={busy || form.problem.trim().length < 10}
              >
                {busy ? t("inquiry.assisting") : t("inquiry.assist")}
              </button>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {assist || t("inquiry.assistHint")}
              </p>
            </div>
          ) : null}
          <Field label={t("inquiry.desired")} hint={t("inquiry.optional")}>
            <textarea
              value={form.desired}
              onChange={(event) => patch("desired", event.target.value)}
            />
          </Field>
          <Field label={t("inquiry.details")} hint={t("inquiry.optional")}>
            <textarea
              value={form.details}
              onChange={(event) => patch("details", event.target.value)}
            />
          </Field>
          <Field label={t("inquiry.name")} error={errors.name}>
            <input value={form.name} onChange={(event) => patch("name", event.target.value)} />
          </Field>
          <Field label={t("inquiry.email")} error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(event) => patch("email", event.target.value)}
            />
          </Field>
          <Field label={t("inquiry.company")} hint={t("inquiry.optional")}>
            <input
              value={form.company}
              onChange={(event) => patch("company", event.target.value)}
            />
          </Field>
          {errors.form ? (
            <p className="text-sm text-[var(--error)]">{t("errors.offline")}</p>
          ) : null}
          {Object.keys(errors).length ? (
            <p className="text-sm text-[var(--error)]">{t("inquiry.errors")}</p>
          ) : null}
          <button className="btn-accent" type="submit" disabled={busy}>
            {busy ? t("inquiry.sending") : t("inquiry.submit")}
          </button>
          {industryName ? (
            <p className="text-sm text-[var(--muted)]">
              {industryName}
              {form.solutionSlug ? ` · ${getSolution(form.solutionSlug)?.name[locale] ?? ""}` : ""}
            </p>
          ) : null}
        </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
