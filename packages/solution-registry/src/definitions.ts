import { text } from "@triunder/domain";
import type { SolutionDefinition } from "./types.js";

/**
 * Solution catalog. `compatibleIndustryIds` must include every industry that
 * lists this solution as `primarySolution` (and any extras you intentionally support).
 */
const crmNav = [
  { id: "dashboard", labelKey: "nav.dashboard", path: "dashboard", icon: "dashboard" },
  { id: "entities", labelKey: "nav.entities", path: "entities", icon: "users" },
  { id: "secondary", labelKey: "nav.secondary", path: "secondary", icon: "calendar" },
  {
    id: "analytics",
    labelKey: "nav.analytics",
    path: "analytics",
    icon: "chart",
    minComplexity: "professional" as const,
  },
  {
    id: "audit",
    labelKey: "nav.audit",
    path: "audit",
    icon: "shield",
    minComplexity: "enterprise" as const,
  },
];

const crmDashboard = [
  { id: "m1", type: "metric" as const, titleKey: "metric.primary", dataKey: "metricPrimary" },
  { id: "m2", type: "metric" as const, titleKey: "metric.secondary", dataKey: "metricSecondary" },
  { id: "chart1", type: "chart" as const, titleKey: "chart.pipeline", dataKey: "pipelineChart" },
];

export const SOLUTIONS: SolutionDefinition[] = [
  {
    id: "crm",
    slug: "crm",
    category: "business-management",
    name: text("CRM", "CRM"),
    description: text(
      "Relationship pipelines, contacts, and follow-up workflows.",
      "Embudo de relaciones, contactos y flujos de seguimiento.",
    ),
    icon: "crm",
    compatibleIndustryIds: [
      "healthcare",
      "finance",
      "real-estate",
      "education",
      "retail",
      "ecommerce",
      "hospitality",
      "automotive",
      "professional-services",
      "technology",
      "telecommunications",
      "tourism",
      "other",
    ],
    navigation: crmNav,
    dashboard: crmDashboard,
    availableModuleIds: ["analytics", "notifications", "follow-ups"],
    defaultComplexity: "professional",
    demoTemplateId: "crm",
    complete: true,
  },
  {
    id: "ecommerce",
    slug: "ecommerce",
    category: "commerce",
    name: text("E-commerce", "Comercio electrónico"),
    description: text(
      "Catalog, cart, checkout simulation, and order management.",
      "Catálogo, carrito, checkout simulado y gestión de pedidos.",
    ),
    icon: "ecommerce",
    compatibleIndustryIds: ["retail", "ecommerce", "food-production"],
    navigation: [
      { id: "dashboard", labelKey: "nav.dashboard", path: "dashboard", icon: "dashboard" },
      { id: "catalog", labelKey: "nav.catalog", path: "catalog", icon: "grid" },
      { id: "cart", labelKey: "nav.cart", path: "cart", icon: "cart" },
      { id: "orders", labelKey: "nav.orders", path: "orders", icon: "orders" },
      { id: "customers", labelKey: "nav.customers", path: "customers", icon: "users" },
    ],
    dashboard: [
      { id: "m1", type: "metric", titleKey: "metric.revenue", dataKey: "revenue" },
      { id: "m2", type: "metric", titleKey: "metric.orders", dataKey: "ordersToday" },
      { id: "chart1", type: "chart", titleKey: "chart.sales", dataKey: "salesChart" },
    ],
    availableModuleIds: ["inventory", "analytics"],
    defaultComplexity: "professional",
    demoTemplateId: "ecommerce",
    complete: true,
  },
  {
    id: "mes",
    slug: "mes",
    category: "operations",
    name: text("Manufacturing Execution (MES)", "Ejecución de manufactura (MES)"),
    description: text(
      "Work orders, production lines, downtime, and plant metrics.",
      "Órdenes de trabajo, líneas, paradas y métricas de planta.",
    ),
    icon: "mes",
    compatibleIndustryIds: ["manufacturing", "food-production"],
    navigation: [
      { id: "dashboard", labelKey: "nav.dashboard", path: "dashboard", icon: "dashboard" },
      { id: "lines", labelKey: "nav.lines", path: "lines", icon: "factory" },
      { id: "work-orders", labelKey: "nav.workOrders", path: "work-orders", icon: "clipboard" },
      { id: "machines", labelKey: "nav.machines", path: "machines", icon: "cpu" },
      {
        id: "maintenance",
        labelKey: "nav.maintenance",
        path: "maintenance",
        icon: "wrench",
        minComplexity: "professional",
      },
    ],
    dashboard: [
      { id: "m1", type: "metric", titleKey: "metric.oee", dataKey: "oee" },
      { id: "m2", type: "metric", titleKey: "metric.activeLines", dataKey: "activeLines" },
      { id: "chart1", type: "chart", titleKey: "chart.throughput", dataKey: "throughputChart" },
    ],
    availableModuleIds: ["inventory", "cmms", "iot-monitoring"],
    defaultComplexity: "professional",
    demoTemplateId: "mes",
    complete: true,
  },
  {
    id: "fleet-management",
    slug: "fleet",
    category: "operations",
    name: text("Fleet Management", "Gestión de flota"),
    description: text(
      "Vehicles, drivers, shipments, and simulated delivery tracking.",
      "Vehículos, conductores, envíos y seguimiento simulado de entregas.",
    ),
    icon: "fleet",
    compatibleIndustryIds: ["logistics"],
    navigation: [
      { id: "dashboard", labelKey: "nav.dashboard", path: "dashboard", icon: "dashboard" },
      { id: "vehicles", labelKey: "nav.vehicles", path: "vehicles", icon: "truck" },
      { id: "drivers", labelKey: "nav.drivers", path: "drivers", icon: "users" },
      { id: "shipments", labelKey: "nav.shipments", path: "shipments", icon: "package" },
    ],
    dashboard: [
      { id: "m1", type: "metric", titleKey: "metric.onTime", dataKey: "onTimeRate" },
      { id: "m2", type: "metric", titleKey: "metric.activeVehicles", dataKey: "activeVehicles" },
      { id: "chart1", type: "chart", titleKey: "chart.deliveries", dataKey: "deliveryChart" },
    ],
    availableModuleIds: ["tracking", "analytics"],
    defaultComplexity: "professional",
    demoTemplateId: "fleet",
    complete: true,
  },
  {
    id: "smart-agriculture",
    slug: "iot",
    category: "hardware-engineering",
    name: text("Smart Agriculture IoT", "IoT de agricultura inteligente"),
    description: text(
      "Sensor networks, telemetry, thresholds, and irrigation simulation.",
      "Redes de sensores, telemetría, umbrales y simulación de riego.",
    ),
    icon: "agriculture",
    compatibleIndustryIds: ["agriculture"],
    navigation: [
      { id: "dashboard", labelKey: "nav.dashboard", path: "dashboard", icon: "dashboard" },
      { id: "devices", labelKey: "nav.devices", path: "devices", icon: "cpu" },
      { id: "telemetry", labelKey: "nav.telemetry", path: "telemetry", icon: "activity" },
      { id: "irrigation", labelKey: "nav.irrigation", path: "irrigation", icon: "droplet" },
    ],
    dashboard: [
      { id: "m1", type: "metric", titleKey: "metric.moisture", dataKey: "avgMoisture" },
      { id: "m2", type: "metric", titleKey: "metric.alerts", dataKey: "activeAlerts" },
      { id: "chart1", type: "chart", titleKey: "chart.telemetry", dataKey: "telemetryChart" },
    ],
    availableModuleIds: ["irrigation", "analytics", "alerts"],
    defaultComplexity: "professional",
    demoTemplateId: "agriculture-iot",
    complete: true,
  },
  // Catalog entries matching industry primarySolution values
  stub("order-management", "orders", "commerce", "Order Management", "Gestión de pedidos", ["ecommerce"]),
  stub("project-management", "project-management", "business-management", "Project Management", "Gestión de proyectos", [
    "construction",
    "professional-services",
  ]),
  stub("booking", "booking", "operations", "Booking & Reservations", "Reservas", [
    "hospitality",
    "tourism",
    "real-estate",
  ]),
  stub("scheduling", "scheduling", "operations", "Scheduling", "Programación", ["automotive", "healthcare", "education"]),
  stub("energy-monitoring", "energy-monitoring", "hardware-engineering", "Energy Monitoring", "Monitoreo energético", [
    "energy",
  ]),
  stub("analytics", "analytics", "data-intelligence", "Analytics Dashboards", "Paneles de analítica", [
    "technology",
    "healthcare",
    "finance",
    "retail",
  ]),
  stub("monitoring", "monitoring", "data-intelligence", "Monitoring Systems", "Sistemas de monitoreo", [
    "telecommunications",
    "technology",
  ]),
  stub("telemetry", "telemetry", "hardware-engineering", "Telemetry Systems", "Sistemas de telemetría", [
    "mining",
    "energy",
    "agriculture",
  ]),
  stub("production-planning", "production-planning", "operations", "Production Planning", "Planificación de producción", [
    "food-production",
    "manufacturing",
  ]),
  stub("workflow", "workflows", "business-management", "Workflow Management", "Gestión de flujos", [
    "other",
    "finance",
    "technology",
  ]),
];

function stub(
  id: string,
  slug: string,
  category: SolutionDefinition["category"],
  en: string,
  es: string,
  industries: string[],
): SolutionDefinition {
  return {
    id,
    slug,
    category,
    name: text(en, es),
    description: text(
      `${en} — catalog entry; full interactive demo expands progressively.`,
      `${es} — entrada de catálogo; la demo interactiva se amplía progresivamente.`,
    ),
    icon: slug,
    compatibleIndustryIds: industries,
    navigation: [{ id: "dashboard", labelKey: "nav.dashboard", path: "dashboard", icon: "dashboard" }],
    dashboard: [],
    availableModuleIds: [],
    defaultComplexity: "professional",
    demoTemplateId: id,
    complete: true,
  };
}
