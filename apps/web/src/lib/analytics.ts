import { client } from "./session";

const KEY = "triunder.analytics";

export function analyticsAllowed(): boolean {
  return localStorage.getItem(KEY) === "yes";
}

export function setAnalytics(allowed: boolean) {
  localStorage.setItem(KEY, allowed ? "yes" : "no");
}

export function analyticsChoice(): "yes" | "no" | null {
  const value = localStorage.getItem(KEY);
  return value === "yes" || value === "no" ? value : null;
}

/** Records a funnel event only after the visitor allows analytics. */
export function track(eventType: string, metadata?: Record<string, string>) {
  if (!analyticsAllowed()) return;
  void client
    .request("/api/v1/analytics/events", {
      method: "POST",
      body: JSON.stringify({ consent: true, events: [{ eventType, metadata }] }),
    })
    .catch(() => undefined);
}
