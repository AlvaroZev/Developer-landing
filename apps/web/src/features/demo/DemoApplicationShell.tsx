import { useMemo, useState } from "react";
import { NavLink, Route, Routes, useParams } from "react-router-dom";
import type { ComplexityLevel } from "@triunder/domain";
import { meetsComplexityLegacy } from "@triunder/domain";
import type { ShowroomIndustry } from "@triunder/industry-registry";
import type { SolutionDefinition } from "@triunder/solution-registry";
import { useI18n } from "../../state/i18n-context";
import { createDemoStore } from "./engine/demo-store";
import { DemoDashboard } from "./views/DemoDashboard";
import { DemoEntityTable } from "./views/DemoEntityTable";
import { DemoNotifications } from "./views/DemoNotifications";
import { getDemoSeed } from "./seeds";

interface DemoApplicationShellProps {
  industry: ShowroomIndustry;
  solution: SolutionDefinition;
  complexity: ComplexityLevel;
}

export function DemoApplicationShell({
  industry,
  solution,
  complexity,
}: DemoApplicationShellProps) {
  const { locale, messages } = useI18n();
  const terminology = industry.terminology[locale];
  const seed = useMemo(
    () => getDemoSeed(solution.demoTemplateId, industry.id),
    [solution.demoTemplateId, industry.id],
  );
  const [store, setStore] = useState(() => createDemoStore(seed));

  const navItems = solution.navigation.filter((item) =>
    meetsComplexityLegacy(item.minComplexity, complexity),
  );

  const base = `/explore/${industry.slug}/${solution.slug}/app`;

  return (
    <div className="min-h-[80vh] border-t" style={{ borderColor: "var(--tri-border)" }}>
      <div className="flex min-h-[80vh]">
        <aside
          className="hidden w-60 shrink-0 border-r p-4 md:block"
          style={{
            background: "var(--tri-sidebar)",
            borderColor: "var(--tri-border)",
            color: "#F8FAFC",
          }}
        >
          <div className="text-xs uppercase tracking-[0.2em] opacity-70">
            {messages.demo.simulated}
          </div>
          <div className="mt-2 font-display text-xl">{solution.name[locale]}</div>
          <div className="mt-1 text-xs opacity-70">{industry.name[locale]}</div>
          <nav className="mt-8 space-y-1" aria-label="Demo">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={`${base}/${item.path}?level=${complexity}`}
                className={({ isActive }) =>
                  `block rounded px-3 py-2 text-sm transition-colors ${
                    isActive ? "bg-white/15" : "hover:bg-white/10"
                  }`
                }
              >
                {resolveNavLabel(item.labelKey, terminology, messages.demo)}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col" style={{ background: "var(--tri-bg)" }}>
          <header
            className="flex items-center justify-between border-b px-4 py-3 md:px-6"
            style={{ background: "var(--tri-header)", borderColor: "var(--tri-border)" }}
          >
            <div>
              <h1 className="font-display text-2xl">
                {terminology.entityPlural}
              </h1>
              <p className="text-xs capitalize" style={{ color: "var(--tri-muted)" }}>
                {complexity} · {messages.demo.simulated}
              </p>
            </div>
            <DemoNotifications store={store} />
          </header>

          <div className="flex-1 p-4 md:p-6">
            <Routes>
              <Route
                path="dashboard"
                element={
                  <DemoDashboard
                    industry={industry}
                    solution={solution}
                    complexity={complexity}
                    store={store}
                  />
                }
              />
              <Route
                path="*"
                element={
                  <DemoEntityTable
                    industry={industry}
                    solution={solution}
                    complexity={complexity}
                    store={store}
                    setStore={setStore}
                  />
                }
              />
            </Routes>
          </div>
        </div>
      </div>
      {/* Mobile nav */}
      <nav
        className="flex gap-2 overflow-x-auto border-t p-2 md:hidden"
        style={{ borderColor: "var(--tri-border)", background: "var(--tri-surface)" }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={`${base}/${item.path}?level=${complexity}`}
            className="whitespace-nowrap rounded px-3 py-1.5 text-xs"
            style={{ border: "1px solid var(--tri-border)" }}
          >
            {resolveNavLabel(item.labelKey, terminology, messages.demo)}
          </NavLink>
        ))}
      </nav>
      <DemoPathSync />
    </div>
  );
}

function resolveNavLabel(
  labelKey: string,
  terminology: Record<string, string>,
  demo: { search: string },
): string {
  const term = (key: string, fallback: string) => terminology[key] ?? fallback;
  if (labelKey === "nav.entities") return term("entityPlural", "Records");
  if (labelKey === "nav.secondary") return term("secondaryEntityPlural", "Items");
  if (labelKey === "nav.dashboard") return "Dashboard";
  if (labelKey === "nav.analytics") return "Analytics";
  if (labelKey === "nav.catalog") return "Catalog";
  if (labelKey === "nav.cart") return "Cart";
  if (labelKey === "nav.orders") return "Orders";
  if (labelKey === "nav.customers") return "Customers";
  if (labelKey === "nav.lines") return "Lines";
  if (labelKey === "nav.workOrders") return term("entityPlural", "Work orders");
  if (labelKey === "nav.machines") return term("secondaryEntityPlural", "Machines");
  if (labelKey === "nav.maintenance") return "Maintenance";
  if (labelKey === "nav.vehicles") return term("secondaryEntityPlural", "Vehicles");
  if (labelKey === "nav.drivers") return "Drivers";
  if (labelKey === "nav.shipments") return term("entityPlural", "Shipments");
  if (labelKey === "nav.devices") return term("entityPlural", "Devices");
  if (labelKey === "nav.telemetry") return "Telemetry";
  if (labelKey === "nav.irrigation") return "Irrigation";
  if (labelKey === "nav.alerts") return "Alerts";
  if (labelKey === "nav.audit") return "Audit";
  return labelKey.replace("nav.", "") || demo.search;
}

function DemoPathSync() {
  // Ensures nested relative routes resolve under /app/*
  useParams();
  return null;
}
