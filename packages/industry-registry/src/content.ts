import type { LocaleCopy } from "./industries";

const copy = (en: string, es: string): LocaleCopy => ({ en, es });

/**
 * Homepage supporting content.
 * Real client portfolio entries live in apps/web/src/content/projects.ts.
 * These fictional case studies remain available for demo storytelling only.
 */
export interface CaseStudy {
  id: string;
  industry: string;
  solution: string;
  client: LocaleCopy;
  title: LocaleCopy;
  summary: LocaleCopy;
}

/** Representative fictional engagements used for demonstration context. */
export const caseStudies: CaseStudy[] = [
  {
    id: "northwind-schedule",
    industry: "healthcare",
    solution: "scheduling",
    client: copy("Northwind Clinic", "Clínica Northwind"),
    title: copy(
      "A schedule the care team can trust",
      "Una agenda en la que el equipo puede confiar",
    ),
    summary: copy(
      "Follow-ups were living in three inboxes. The demonstration shows the appointment book, the clinician, and the visit that should not be double booked.",
      "Los seguimientos vivían en tres bandejas. La demostración muestra la agenda, el clínico y la visita que no debería reservarse dos veces.",
    ),
  },
  {
    id: "helio-mes",
    industry: "manufacturing",
    solution: "manufacturing-execution",
    client: copy("Helio Metalworks", "Helio Metalworks"),
    title: copy("The count that left the cell", "La cantidad que salió de la celda"),
    summary: copy(
      "Production meetings were arguing with the whiteboard. The floor view tracks the work order, the line, and the downtime that explains the gap.",
      "Las reuniones de producción discutían con la pizarra. La vista de planta sigue la orden, la línea y el paro que explica la diferencia.",
    ),
  },
  {
    id: "aguilar-water",
    industry: "agriculture",
    solution: "smart-agriculture",
    client: copy("Aguilar Farms", "Granja Aguilar"),
    title: copy("Water when the soil asks", "Agua cuando el suelo la pide"),
    summary: copy(
      "Irrigation was running on a clock. The field view reads moisture, holds a threshold, and opens a valve without pretending a pump is wired to the laptop.",
      "El riego corría con un reloj. La vista de campo lee la humedad, sostiene un umbral y abre una válvula sin fingir que la bomba está conectada al portátil.",
    ),
  },
  {
    id: "northgrid-load",
    industry: "energy",
    solution: "energy-monitoring",
    client: copy("Northgrid", "Northgrid"),
    title: copy(
      "A load that should not cross the line",
      "Una carga que no debería cruzar el límite",
    ),
    summary: copy(
      "Operators needed the meter, the circuit, and the alert in one place. The demonstration keeps the threshold visible and labels every reading as simulated.",
      "Los operadores necesitaban el medidor, el circuito y la alerta en un solo lugar. La demostración deja el umbral a la vista y marca cada lectura como simulada.",
    ),
  },
];

export interface Capability {
  id: string;
  title: LocaleCopy;
  body: LocaleCopy;
  industry: string;
  solution: string;
}

export const capabilities: Capability[] = [
  {
    id: "software",
    title: copy("Custom business systems", "Sistemas de negocio a medida"),
    body: copy(
      "Records, workflows, and the screen a team uses every day.",
      "Registros, flujos y la pantalla que un equipo usa cada día.",
    ),
    industry: "professional-services",
    solution: "project-management",
  },
  {
    id: "web",
    title: copy("Web applications", "Aplicaciones web"),
    body: copy(
      "Product interfaces that stay clear under real operational load.",
      "Interfaces de producto que se mantienen claras bajo carga operativa real.",
    ),
    industry: "technology-saas",
    solution: "customer-portals",
  },
  {
    id: "commerce",
    title: copy("E-commerce and marketplaces", "E-commerce y marketplaces"),
    body: copy(
      "Catalogs, orders, and inventory that move together.",
      "Catálogos, pedidos e inventario que se mueven juntos.",
    ),
    industry: "retail",
    solution: "point-of-sale",
  },
  {
    id: "ai",
    title: copy("AI-powered applications", "Aplicaciones con inteligencia artificial"),
    body: copy(
      "Assistance grounded in your documents, with citations you can check.",
      "Asistencia anclada a sus documentos, con citas que se pueden verificar.",
    ),
    industry: "technology-saas",
    solution: "rag-applications",
  },
  {
    id: "automation",
    title: copy("Process automation", "Automatización de procesos"),
    body: copy(
      "Fewer handoffs between systems that should already agree.",
      "Menos transferencias entre sistemas que ya deberían coincidir.",
    ),
    industry: "manufacturing",
    solution: "industrial-automation",
  },
  {
    id: "data",
    title: copy("Data platforms and analytics", "Plataformas de datos y analítica"),
    body: copy(
      "Numbers with a source, and decisions you can defend.",
      "Números con origen y decisiones que se pueden defender.",
    ),
    industry: "finance",
    solution: "decision-support",
  },
  {
    id: "iot",
    title: copy("Industrial IoT and hardware integration", "IoT industrial e integración con hardware"),
    body: copy(
      "Devices, thresholds, and controls — simulated in the showroom, engineered for the floor.",
      "Dispositivos, umbrales y controles — simulados en el showroom, diseñados para planta.",
    ),
    industry: "manufacturing",
    solution: "industrial-iot",
  },
  {
    id: "robotics",
    title: copy("Robotics and control systems", "Robótica y sistemas de control"),
    body: copy(
      "Loops, poses, telemetry, and a stop that forces the output to zero.",
      "Lazos, posiciones, telemetría y una parada que fuerza la salida a cero.",
    ),
    industry: "manufacturing",
    solution: "robotics",
  },
];

export const processSteps: { title: LocaleCopy; body: LocaleCopy }[] = [
  {
    title: copy("Discover the operation", "Descubrir la operación"),
    body: copy(
      "Map the work that is late, duplicated, uncounted, or still on paper.",
      "Mapear el trabajo que llega tarde, se duplica, no se cuenta o sigue en papel.",
    ),
  },
  {
    title: copy("Shape the architecture", "Definir la arquitectura"),
    body: copy(
      "Choose the smallest coherent system that can carry the real workflow.",
      "Elegir el sistema coherente más pequeño que pueda sostener el flujo real.",
    ),
  },
  {
    title: copy("Build and verify", "Construir y verificar"),
    body: copy(
      "Ship working slices with tests, realistic data, and clear ownership boundaries.",
      "Entregar partes funcionales con pruebas, datos realistas y límites claros de propiedad.",
    ),
  },
  {
    title: copy("Deploy and improve", "Desplegar y mejorar"),
    body: copy(
      "Put the system in production, watch the operation, and tighten what still friction.",
      "Poner el sistema en producción, observar la operación y afinar lo que aún genera fricción.",
    ),
  },
];

export const defaultFeatured: { industry: string; solution: string }[] = [
  { industry: "healthcare", solution: "scheduling" },
  { industry: "manufacturing", solution: "manufacturing-execution" },
  { industry: "agriculture", solution: "smart-agriculture" },
  { industry: "finance", solution: "billing" },
  { industry: "logistics", solution: "fleet-management" },
  { industry: "energy", solution: "energy-monitoring" },
];

/** Highlighted industries for the homepage industry strip. */
export const spotlightIndustries = [
  "healthcare",
  "finance",
  "retail",
  "manufacturing",
  "logistics",
  "agriculture",
  "energy",
  "technology-saas",
] as const;
