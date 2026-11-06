import { useState } from "react";
import { useI18n } from "../../../state/i18n-context";
import type { DemoStore } from "../engine/demo-store";

export function DemoNotifications({ store }: { store: DemoStore }) {
  const { messages } = useI18n();
  const [open, setOpen] = useState(false);
  const unread = store.notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        className="rounded border px-3 py-1.5 text-xs"
        style={{ borderColor: "var(--tri-border)" }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={messages.demo.notifications}
      >
        {messages.demo.notifications}
        {unread > 0 ? ` (${unread})` : ""}
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-2 w-72 rounded border p-3 shadow-lg"
          style={{ background: "var(--tri-surface)", borderColor: "var(--tri-border)" }}
        >
          {store.notifications.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--tri-muted)" }}>
              {messages.demo.empty}
            </p>
          ) : (
            <ul className="space-y-3">
              {store.notifications.map((n) => (
                <li key={n.id} className="text-sm">
                  <div className="font-medium">{n.title}</div>
                  <div style={{ color: "var(--tri-muted)" }}>{n.body}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
