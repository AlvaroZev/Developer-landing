import { Link } from "react-router-dom";
import { useI18n } from "../state/i18n-context";

export function NotFoundPage() {
  const { messages } = useI18n();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl">404</h1>
      <p className="mt-3" style={{ color: "var(--tri-muted)" }}>
        {messages.common.error}
      </p>
      <Link to="/" className="mt-6 inline-block underline">
        Triunder
      </Link>
    </div>
  );
}
