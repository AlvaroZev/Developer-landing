import type { ComplexityLevel } from "@triunder/domain";
import { meetsComplexityLegacy } from "@triunder/domain";
import type { ShowroomIndustry } from "@triunder/industry-registry";
import type { SolutionDefinition } from "@triunder/solution-registry";
import { useI18n } from "../../../state/i18n-context";
import type { DemoStore } from "../engine/demo-store";

interface Props {
  industry: ShowroomIndustry;
  solution: SolutionDefinition;
  complexity: ComplexityLevel;
  store: DemoStore;
}

export function DemoDashboard({ industry, solution, complexity, store }: Props) {
  const { locale } = useI18n();
  const terminology = industry.terminology[locale];
  const widgets = solution.dashboard.filter((w) =>
    meetsComplexityLegacy(w.minComplexity, complexity),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {widgets
          .filter((w) => w.type === "metric")
          .map((widget) => (
            <div
              key={widget.id}
              className="border-l-2 pl-4"
              style={{ borderColor: "var(--tri-accent)" }}
            >
              <div className="text-xs uppercase tracking-wider" style={{ color: "var(--tri-muted)" }}>
                {resolveMetricTitle(widget.dataKey, terminology)}
              </div>
              <div className="mt-2 font-display text-3xl">
                {String(store.metrics[widget.dataKey] ?? "—")}
              </div>
            </div>
          ))}
      </div>

      {widgets
        .filter((w) => w.type === "chart")
        .map((widget) => {
          const series = store.charts[widget.dataKey] ?? [];
          const max = Math.max(...series.map((p) => p.value), 1);
          return (
            <div key={widget.id} className="rounded border p-4" style={{ borderColor: "var(--tri-border)", background: "var(--tri-surface)" }}>
              <h3 className="text-sm font-medium">{widget.titleKey.replace("chart.", "")}</h3>
              <div className="mt-4 flex h-40 items-end gap-2">
                {series.map((point) => (
                  <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${(point.value / max) * 100}%`,
                        background: "var(--tri-accent)",
                        minHeight: 4,
                      }}
                      title={`${point.label}: ${point.value}`}
                    />
                    <span className="text-[10px]" style={{ color: "var(--tri-muted)" }}>
                      {point.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      {complexity !== "starter" && store.notifications.length > 0 && (
        <div className="rounded border p-4" style={{ borderColor: "var(--tri-border)", background: "var(--tri-surface)" }}>
          <h3 className="text-sm font-medium">Alerts</h3>
          <ul className="mt-3 space-y-2">
            {store.notifications.slice(0, 3).map((n) => (
              <li key={n.id} className="text-sm">
                <span className="font-medium">{n.title}</span>
                <span style={{ color: "var(--tri-muted)" }}> — {n.body}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function resolveMetricTitle(dataKey: string, terminology: Record<string, string>): string {
  if (dataKey === "metricPrimary") return terminology.metricPrimary ?? "Primary metric";
  if (dataKey === "metricSecondary") return terminology.metricSecondary ?? "Secondary metric";
  return dataKey;
}
