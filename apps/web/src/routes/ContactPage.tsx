import { useI18n } from "../state/i18n-context";

export function ContactPage() {
  const { messages, locale } = useI18n();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:px-6">
      <h1 className="font-display text-4xl">{messages.nav.contact}</h1>
      <p className="mt-4" style={{ color: "var(--tri-muted)" }}>
        {locale === "es"
          ? "Envíe una consulta de proyecto cuando esté listo. La exploración no requiere registro."
          : "Submit a project inquiry when you are ready. Exploration does not require registration."}
      </p>
      <form
        className="mt-10 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          // Backend inquiry endpoint lands in Phase 7/9 — form is wired for UX continuity.
          alert(
            locale === "es"
              ? "La API de consultas se activará con el backend. Su interés queda registrado en esta sesión."
              : "The inquiry API activates with the backend. Your interest is noted for this session.",
          );
        }}
      >
        <label className="block text-sm">
          {messages.auth.email}
          <input
            required
            type="email"
            name="email"
            className="mt-1 w-full rounded border px-3 py-2"
            style={{
              borderColor: "var(--tri-border)",
              background: "var(--tri-surface)",
              color: "var(--tri-text)",
            }}
          />
        </label>
        <label className="block text-sm">
          {locale === "es" ? "Mensaje" : "Message"}
          <textarea
            required
            name="message"
            rows={5}
            className="mt-1 w-full rounded border px-3 py-2"
            style={{
              borderColor: "var(--tri-border)",
              background: "var(--tri-surface)",
              color: "var(--tri-text)",
            }}
          />
        </label>
        <button
          type="submit"
          className="rounded px-5 py-2.5 text-sm font-semibold"
          style={{ background: "var(--tri-primary)", color: "var(--tri-bg)" }}
        >
          {messages.config.requestConsultation}
        </button>
      </form>
    </div>
  );
}
