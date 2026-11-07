import { L, money, num, opt, select, text } from "./dsl";
import type { Copy, FieldDef } from "./types";

/**
 * Industry vocabulary layered onto a shared blueprint.
 * This is how a healthcare CRM becomes a patient record without forking the
 * whole solution. Keep overrides small and domain-specific.
 */
export const termOverrides: Record<
  string,
  Record<string, Record<string, { singular: Copy; plural: Copy }>>
> = {
  healthcare: {
    crm: {
      contacts: { singular: L("Patient", "Paciente"), plural: L("Patients", "Pacientes") },
      accounts: {
        singular: L("Care site", "Centro de atención"),
        plural: L("Care sites", "Centros de atención"),
      },
    },
  },
  finance: {
    crm: { contacts: { singular: L("Client", "Cliente"), plural: L("Clients", "Clientes") } },
  },
  retail: {
    crm: {
      contacts: {
        singular: L("Shopper", "Cliente de tienda"),
        plural: L("Shoppers", "Clientes de tienda"),
      },
    },
  },
  "real-estate": {
    crm: { contacts: { singular: L("Lead", "Prospecto"), plural: L("Leads", "Prospectos") } },
  },
  education: {
    crm: {
      contacts: { singular: L("Student", "Estudiante"), plural: L("Students", "Estudiantes") },
    },
  },
  automotive: {
    crm: { contacts: { singular: L("Owner", "Propietario"), plural: L("Owners", "Propietarios") } },
  },
  "professional-services": {
    crm: { contacts: { singular: L("Client", "Cliente"), plural: L("Clients", "Clientes") } },
  },
  "technology-saas": {
    crm: {
      contacts: {
        singular: L("Account user", "Usuario de cuenta"),
        plural: L("Account users", "Usuarios de cuenta"),
      },
    },
  },
  tourism: {
    crm: { contacts: { singular: L("Traveler", "Viajero"), plural: L("Travelers", "Viajeros") } },
  },
};

export const labelOverrides: Record<string, Record<string, Record<string, Copy>>> = {
  healthcare: { scheduling: { "appointments.person": L("Patient", "Paciente") } },
  education: { scheduling: { "appointments.person": L("Student", "Estudiante") } },
  automotive: { scheduling: { "appointments.person": L("Customer", "Cliente") } },
  construction: { scheduling: { "appointments.person": L("Crew lead", "Jefe de cuadrilla") } },
  logistics: { scheduling: { "appointments.person": L("Dock clerk", "Encargado de muelle") } },
  "professional-services": { scheduling: { "appointments.person": L("Client", "Cliente") } },
};

const programs = [
  opt("primary", "Primary care", "Atención primaria"),
  opt("cardio", "Cardiology", "Cardiología"),
  opt("imaging", "Imaging", "Imagen"),
];
const tiers = [opt("member", "Member", "Miembro"), opt("insider", "Insider", "Frecuente")];
const books = [opt("retail", "Retail", "Minorista"), opt("commercial", "Commercial", "Comercial")];
const visits = [
  opt("new", "New visit", "Visita nueva"),
  opt("follow_up", "Follow-up", "Seguimiento"),
  opt("procedure", "Procedure", "Procedimiento"),
];

export const fieldExtensions: Record<
  string,
  Record<string, { entity: string; fields: FieldDef[] }[]>
> = {
  healthcare: {
    crm: [
      {
        entity: "contacts",
        fields: [
          text("mrn", "Medical record", "Historia clínica", { required: true, searchable: true }),
          select("program", "Care program", "Programa", programs, { required: true }),
        ],
      },
    ],
    scheduling: [
      {
        entity: "appointments",
        fields: [select("visitType", "Visit type", "Tipo de visita", visits, { required: true })],
      },
    ],
  },
  finance: {
    crm: [
      {
        entity: "contacts",
        fields: [
          select("book", "Book", "Cartera", books),
          money("exposure", "Exposure", "Exposición", { min: 0 }),
        ],
      },
    ],
    billing: [
      { entity: "invoices", fields: [text("productLine", "Product line", "Línea de producto")] },
    ],
  },
  retail: {
    crm: [
      {
        entity: "contacts",
        fields: [
          select("tier", "Tier", "Nivel", tiers),
          num("visits", "Visits", "Visitas", { min: 0 }),
        ],
      },
    ],
  },
  "real-estate": {
    crm: [
      {
        entity: "contacts",
        fields: [
          money("budget", "Budget", "Presupuesto", { min: 0 }),
          text("interest", "Property interest", "Interés"),
        ],
      },
    ],
    "booking-reservations": [
      {
        entity: "reservations",
        fields: [text("property", "Property", "Inmueble", { required: true })],
      },
    ],
  },
  education: {
    crm: [
      {
        entity: "contacts",
        fields: [text("cohort", "Cohort", "Cohorte"), text("program", "Program", "Programa")],
      },
    ],
    scheduling: [{ entity: "appointments", fields: [text("course", "Course", "Curso")] }],
  },
  automotive: {
    crm: [
      {
        entity: "contacts",
        fields: [
          text("vehicle", "Vehicle", "Vehículo"),
          text("vin", "VIN", "VIN", { searchable: true }),
        ],
      },
    ],
    scheduling: [{ entity: "appointments", fields: [text("bay", "Bay", "Bahía")] }],
  },
  "professional-services": {
    crm: [{ entity: "contacts", fields: [text("matter", "Matter", "Asunto")] }],
    billing: [{ entity: "invoices", fields: [text("matter", "Matter", "Asunto")] }],
    scheduling: [{ entity: "appointments", fields: [text("engagement", "Engagement", "Encargo")] }],
  },
  "technology-saas": {
    crm: [
      {
        entity: "contacts",
        fields: [text("plan", "Plan", "Plan"), num("seats", "Seats", "Puestos", { min: 1 })],
      },
    ],
    billing: [
      { entity: "invoices", fields: [text("subscriptionRef", "Subscription", "Suscripción")] },
    ],
  },
  tourism: {
    crm: [
      {
        entity: "contacts",
        fields: [
          num("partySize", "Party size", "Tamaño del grupo", { min: 1 }),
          text("destination", "Destination", "Destino"),
        ],
      },
    ],
  },
  construction: {
    scheduling: [{ entity: "appointments", fields: [text("site", "Site", "Obra")] }],
  },
  logistics: {
    scheduling: [{ entity: "appointments", fields: [text("dock", "Dock", "Muelle")] }],
  },
  telecommunications: {
    billing: [{ entity: "invoices", fields: [text("msisdn", "Line", "Línea")] }],
  },
  hospitality: {
    "booking-reservations": [
      {
        entity: "reservations",
        fields: [
          select("service", "Service", "Servicio", [
            opt("dinner", "Dinner", "Cena"),
            opt("stay", "Stay", "Estancia"),
          ]),
        ],
      },
    ],
  },
  manufacturing: {
    "manufacturing-execution": [
      { entity: "workOrders", fields: [text("shift", "Shift", "Turno")] },
    ],
  },
  agriculture: {
    "smart-agriculture": [{ entity: "fields", fields: [text("block", "Block", "Bloque")] }],
  },
  energy: {
    "energy-monitoring": [{ entity: "meters", fields: [text("feeder", "Feeder", "Alimentador")] }],
  },
  mining: {
    "maintenance-management": [{ entity: "assets", fields: [text("pit", "Pit", "Tajo")] }],
  },
  "food-production": {
    "manufacturing-execution": [
      { entity: "workOrders", fields: [text("lot", "Lot", "Lote", { required: true })] },
    ],
  },
};
