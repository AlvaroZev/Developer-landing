import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SiteHeader } from "../components/chrome";
import { Field } from "../components/ui";
import { track } from "../lib/analytics";
import { useLocale } from "../lib/locale";
import { client, useSession } from "../lib/session";

export function LoginPage() {
  const { t } = useLocale();
  const { refresh, config } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await client.request("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await refresh();
      navigate("/account");
    } catch {
      setError(t("auth.invalidCredentials"));
    }
  }

  return (
    <AuthShell title={t("auth.signIn")}>
      <form className="grid gap-3" onSubmit={submit}>
        <Field label={t("auth.email")}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label={t("auth.password")}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}
        <button className="btn" type="submit">
          {t("auth.signIn")}
        </button>
        {config.oauth.google ? (
          <a className="btn-quiet" href="/api/v1/auth/oauth/google">
            {t("auth.google")}
          </a>
        ) : null}
        <Link to="/forgot-password">{t("auth.forgot")}</Link>
        <Link to="/register">{t("auth.noAccount")}</Link>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { t, locale } = useLocale();
  const { refresh } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await client.request("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          preferredLanguage: locale,
          inquiryId: params.get("inquiry") ?? "",
        }),
      });
      await refresh();
      track("account_registered");
      navigate("/account");
    } catch {
      setError(t("auth.conflict"));
    }
  }

  return (
    <AuthShell title={t("auth.register")}>
      <form className="grid gap-3" onSubmit={submit}>
        <Field label={t("auth.email")}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label={t("auth.password")} hint={t("auth.passwordHint")}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}
        <button className="btn" type="submit">
          {t("auth.register")}
        </button>
        <Link to="/login">{t("auth.hasAccount")}</Link>
      </form>
    </AuthShell>
  );
}

export function ForgotPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <AuthShell title={t("auth.forgot")}>
      {sent ? (
        <p>{t("auth.forgotSent")}</p>
      ) : (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void client
              .request("/api/v1/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
              })
              .finally(() => setSent(true));
          }}
        >
          <p className="text-sm text-[var(--muted)]">{t("auth.forgotLead")}</p>
          <Field label={t("auth.email")}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <button className="btn" type="submit">
            {t("auth.forgot")}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPage() {
  const { t } = useLocale();
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  return (
    <AuthShell title={t("auth.reset")}>
      {done ? (
        <p>{t("auth.resetDone")}</p>
      ) : (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void client
              .request("/api/v1/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ token: params.get("token") ?? "", password }),
              })
              .then(() => setDone(true))
              .catch(() => setError(t("errors.generic")));
          }}
        >
          <Field label={t("auth.password")}>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}
          <button className="btn" type="submit">
            {t("auth.resetAction")}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="panel-elevated p-6">
          <h1 className="mb-6 font-serif text-4xl">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
