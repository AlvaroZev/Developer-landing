import {
  L,
  bars,
  count,
  date,
  defineBlueprint,
  donut,
  entity,
  flow,
  money,
  num,
  opt,
  rel,
  select,
  status,
  sum,
  text,
} from "../dsl";
import type { Blueprint } from "../types";

const calendarRange = { startField: "start", endField: "end" };

export const operationsBlueprints: Blueprint[] = [
  defineBlueprint({
    slug: "warehouse-management",
    presentation: "operations",
    entities: [
      entity(
        "locations",
        L("Location", "Ubicación"),
        L("Locations", "Ubicaciones"),
        [
          text("code", "Code", "Código", { required: true }),
          text("zone", "Zone", "Zona"),
          num("capacity", "Capacity", "Capacidad", { min: 0 }),
          status([opt("open", "Open", "Abierta"), opt("hold", "Hold", "Retenida")]),
        ],
        flow(["open", "hold"]),
      ),
      entity("inventory", L("Inventory", "Inventario"), L("Inventory", "Inventario"), [
        text("sku", "SKU", "SKU", { required: true }),
        rel("locationId", "Location", "Ubicación", "locations", { required: true }),
        num("onHand", "On hand", "Existencias", { min: 0 }),
      ]),
      entity(
        "receipts",
        L("Receipt", "Recepción"),
        L("Receipts", "Recepciones"),
        [
          text("reference", "Reference", "Referencia", { required: true }),
          rel("locationId", "Location", "Ubicación", "locations", { required: true }),
          num("quantity", "Quantity", "Cantidad", { min: 1 }),
          status([
            opt("expected", "Expected", "Esperada"),
            opt("received", "Received", "Recibida"),
          ]),
        ],
        flow(["expected", "received"]),
      ),
      entity(
        "picks",
        L("Pick", "Pick"),
        L("Picks", "Picks"),
        [
          text("reference", "Reference", "Referencia", { required: true }),
          rel("locationId", "Location", "Ubicación", "locations", { required: true }),
          num("quantity", "Quantity", "Cantidad", { min: 1 }),
          status([
            opt("released", "Released", "Liberado"),
            opt("picked", "Picked", "Preparado"),
            opt("short", "Short", "Incompleto"),
          ]),
        ],
        flow(["released", "picked"], [{ from: "released", to: ["short"] }]),
      ),
    ],
    dashboard: [
      count("picks", "Picks released", "Picks liberados", "picks", "released"),
      count("inbound", "Receipts expected", "Recepciones esperadas", "receipts", "expected"),
      bars("on-hand", "On hand", "Existencias", "inventory", "onHand"),
      donut("locations", "Locations", "Ubicaciones", "locations"),
    ],
  }),
  defineBlueprint({
    slug: "fleet-management",
    presentation: "operations",
    entities: [
      entity(
        "vehicles",
        L("Vehicle", "Vehículo"),
        L("Vehicles", "Vehículos"),
        [
          text("unit", "Unit", "Unidad", { required: true }),
          text("plate", "Plate", "Placa", { required: true }),
          num("mileage", "Mileage", "Kilometraje", { min: 0 }),
          status([
            opt("available", "Available", "Disponible"),
            opt("assigned", "Assigned", "Asignado"),
            opt("shop", "In shop", "En taller"),
          ]),
        ],
        flow(["available", "assigned", "shop"]),
      ),
      entity(
        "drivers",
        L("Driver", "Conductor"),
        L("Drivers", "Conductores"),
        [
          text("fullName", "Name", "Nombre", { required: true }),
          text("phone", "Phone", "Teléfono"),
          text("license", "License", "Licencia"),
          status([opt("off", "Off duty", "Fuera de turno"), opt("on_duty", "On duty", "En turno")]),
        ],
        flow(["off", "on_duty"]),
      ),
      entity(
        "trips",
        L("Trip", "Viaje"),
        L("Trips", "Viajes"),
        [
          rel("vehicleId", "Vehicle", "Vehículo", "vehicles", { required: true }),
          rel("driverId", "Driver", "Conductor", "drivers", { required: true }),
          text("destination", "Destination", "Destino", { required: true }),
          status([
            opt("planned", "Planned", "Planificado"),
            opt("enroute", "En route", "En ruta"),
            opt("done", "Done", "Terminado"),
          ]),
        ],
        flow(["planned", "enroute", "done"]),
      ),
      entity(
        "jobs",
        L("Maintenance", "Mantenimiento"),
        L("Maintenance", "Mantenimiento"),
        [
          rel("vehicleId", "Vehicle", "Vehículo", "vehicles", { required: true }),
          text("kind", "Kind", "Tipo", { required: true }),
          status([opt("due", "Due", "Pendiente"), opt("done", "Done", "Hecho")]),
        ],
        flow(["due", "done"]),
      ),
    ],
    dashboard: [
      count("out", "Vehicles assigned", "Vehículos asignados", "vehicles", "assigned"),
      count("due", "Maintenance due", "Mantenimiento pendiente", "jobs", "due"),
      donut("fleet", "Fleet", "Flota", "vehicles"),
      bars("mileage", "Mileage", "Kilometraje", "vehicles", "mileage"),
    ],
  }),
  defineBlueprint({
    slug: "logistics-management",
    presentation: "operations",
    entities: [
      entity(
        "lanes",
        L("Lane", "Ruta"),
        L("Lanes", "Rutas"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("origin", "Origin", "Origen", { required: true }),
          text("destination", "Destination", "Destino", { required: true }),
          status([opt("open", "Open", "Abierta"), opt("closed", "Closed", "Cerrada")]),
        ],
        flow(["open", "closed"]),
      ),
      entity(
        "carriers",
        L("Carrier", "Transportista"),
        L("Carriers", "Transportistas"),
        [
          text("name", "Name", "Nombre", { required: true }),
          num("onTime", "On-time %", "Puntualidad %", { min: 0, max: 100 }),
          status([opt("active", "Active", "Activo"), opt("hold", "Hold", "Retenido")]),
        ],
        flow(["active", "hold"]),
      ),
      entity(
        "shipments",
        L("Shipment", "Envío"),
        L("Shipments", "Envíos"),
        [
          text("reference", "Reference", "Referencia", { required: true }),
          rel("laneId", "Lane", "Ruta", "lanes", { required: true }),
          rel("carrierId", "Carrier", "Transportista", "carriers", { required: true }),
          status([
            opt("ready", "Ready", "Listo"),
            opt("tendered", "Tendered", "Asignado"),
            opt("exception", "Exception", "Excepción"),
            opt("delivered", "Delivered", "Entregado"),
          ]),
        ],
        flow(["ready", "tendered", "delivered"], [{ from: "tendered", to: ["exception"] }]),
      ),
      entity(
        "exceptions",
        L("Exception", "Excepción"),
        L("Exceptions", "Excepciones"),
        [
          rel("shipmentId", "Shipment", "Envío", "shipments", { required: true }),
          text("reason", "Reason", "Motivo", { required: true }),
          status([opt("open", "Open", "Abierta"), opt("closed", "Closed", "Cerrada")]),
        ],
        flow(["open", "closed"]),
      ),
    ],
    dashboard: [
      count("live", "Tendered shipments", "Envíos asignados", "shipments", "tendered"),
      count("exceptions", "Open exceptions", "Excepciones abiertas", "exceptions", "open"),
      donut("shipments", "Shipments", "Envíos", "shipments"),
      bars("carriers", "On-time", "Puntualidad", "carriers", "onTime"),
    ],
  }),
  defineBlueprint({
    slug: "manufacturing-execution",
    presentation: "operations",
    entities: [
      entity(
        "lines",
        L("Line", "Línea"),
        L("Lines", "Líneas"),
        [
          text("name", "Name", "Nombre", { required: true }),
          num("oee", "Availability", "Disponibilidad", { min: 0, max: 100 }),
          status([opt("running", "Running", "En marcha"), opt("down", "Down", "Detenida")]),
        ],
        flow(["running", "down"]),
      ),
      entity(
        "workOrders",
        L("Work order", "Orden de trabajo"),
        L("Work orders", "Órdenes de trabajo"),
        [
          text("number", "Number", "Número", { required: true }),
          text("item", "Item", "Artículo", { required: true }),
          rel("lineId", "Line", "Línea", "lines", { required: true }),
          num("quantity", "Quantity", "Cantidad", { min: 1 }),
          num("good", "Good", "Buenas", { min: 0, readonly: true }),
          status([
            opt("released", "Released", "Liberada"),
            opt("running", "Running", "En proceso"),
            opt("done", "Done", "Terminada"),
            opt("stopped", "Stopped", "Detenida"),
          ]),
        ],
        flow(["released", "running", "done"], [{ from: "running", to: ["stopped"] }]),
      ),
      entity(
        "downtime",
        L("Downtime", "Paro"),
        L("Downtime", "Paros"),
        [
          rel("lineId", "Line", "Línea", "lines", { required: true }),
          text("reason", "Reason", "Motivo", { required: true }),
          num("minutes", "Minutes", "Minutos", { min: 0 }),
          status([opt("open", "Open", "Abierto"), opt("closed", "Closed", "Cerrado")]),
        ],
        flow(["open", "closed"]),
      ),
      entity("scrap", L("Scrap", "Scrap"), L("Scrap", "Scrap"), [
        rel("workOrderId", "Work order", "Orden", "workOrders", { required: true }),
        num("quantity", "Quantity", "Cantidad", { min: 0 }),
        text("reason", "Reason", "Motivo"),
      ]),
    ],
    dashboard: [
      count("running", "Orders running", "Órdenes en proceso", "workOrders", "running"),
      count("down", "Open downtime", "Paros abiertos", "downtime", "open"),
      bars("oee", "Line availability", "Disponibilidad", "lines", "oee"),
      donut("orders", "Work orders", "Órdenes", "workOrders"),
    ],
  }),
  defineBlueprint({
    slug: "maintenance-management",
    presentation: "operations",
    entities: [
      entity(
        "assets",
        L("Asset", "Activo"),
        L("Assets", "Activos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("area", "Area", "Área"),
          select("criticality", "Criticality", "Criticidad", [
            opt("high", "High", "Alta"),
            opt("medium", "Medium", "Media"),
            opt("low", "Low", "Baja"),
          ]),
          status([
            opt("running", "Running", "En marcha"),
            opt("maintenance", "Maintenance", "En mantenimiento"),
            opt("down", "Down", "Detenido"),
          ]),
        ],
        flow(["running", "maintenance", "down"]),
      ),
      entity(
        "workOrders",
        L("Work order", "Orden"),
        L("Work orders", "Órdenes"),
        [
          rel("assetId", "Asset", "Activo", "assets", { required: true }),
          text("title", "Title", "Título", { required: true }),
          select("priority", "Priority", "Prioridad", [
            opt("urgent", "Urgent", "Urgente"),
            opt("normal", "Normal", "Normal"),
          ]),
          status([
            opt("open", "Open", "Abierta"),
            opt("in_progress", "In progress", "En curso"),
            opt("done", "Done", "Terminada"),
          ]),
        ],
        flow(["open", "in_progress", "done"]),
      ),
      entity("parts", L("Part", "Repuesto"), L("Parts", "Repuestos"), [
        text("sku", "SKU", "SKU", { required: true }),
        text("name", "Name", "Nombre", { required: true }),
        num("onHand", "On hand", "Existencias", { min: 0 }),
        num("reorderAt", "Reorder at", "Reponer en", { min: 0 }),
      ]),
      entity(
        "schedules",
        L("Schedule", "Plan"),
        L("Schedules", "Planes"),
        [
          rel("assetId", "Asset", "Activo", "assets", { required: true }),
          text("task", "Task", "Tarea", { required: true }),
          date("due", "Due", "Vence"),
          status([opt("scheduled", "Scheduled", "Programado"), opt("done", "Done", "Hecho")]),
        ],
        flow(["scheduled", "done"]),
      ),
    ],
    dashboard: [
      count("down", "Assets down", "Activos detenidos", "assets", "down"),
      count("open", "Open work", "Trabajo abierto", "workOrders", "open"),
      donut("assets", "Assets", "Activos", "assets"),
      bars("parts", "Parts on hand", "Repuestos", "parts", "onHand"),
    ],
  }),
  defineBlueprint({
    slug: "booking-reservations",
    presentation: "calendar",
    calendar: { entity: "reservations", resourceField: "resourceId", ...calendarRange },
    entities: [
      entity(
        "resources",
        L("Resource", "Recurso"),
        L("Resources", "Recursos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("kind", "Kind", "Tipo"),
          num("capacity", "Capacity", "Capacidad", { min: 1 }),
          status([opt("open", "Open", "Abierto"), opt("closed", "Closed", "Cerrado")]),
        ],
        flow(["open", "closed"]),
      ),
      entity("guests", L("Guest", "Huésped"), L("Guests", "Huéspedes"), [
        text("fullName", "Name", "Nombre", { required: true }),
        text("email", "Email", "Correo"),
        text("phone", "Phone", "Teléfono"),
      ]),
      entity(
        "reservations",
        L("Reservation", "Reserva"),
        L("Reservations", "Reservas"),
        [
          rel("resourceId", "Resource", "Recurso", "resources", { required: true }),
          text("guest", "Guest", "Huésped", { required: true }),
          date("start", "Start", "Inicio", { required: true }),
          date("end", "End", "Fin", { required: true }),
          num("party", "Party", "Personas", { min: 1 }),
          status([
            opt("held", "Held", "Apartada"),
            opt("confirmed", "Confirmed", "Confirmada"),
            opt("seated", "Arrived", "Llegó"),
            opt("cancelled", "Cancelled", "Cancelada"),
          ]),
        ],
        flow(
          ["held", "confirmed", "seated"],
          [
            { from: "held", to: ["cancelled"] },
            { from: "confirmed", to: ["cancelled"] },
          ],
        ),
      ),
      entity("rates", L("Rate", "Tarifa"), L("Rates", "Tarifas"), [
        rel("resourceId", "Resource", "Recurso", "resources", { required: true }),
        text("name", "Name", "Nombre", { required: true }),
        money("price", "Price", "Precio", { min: 0 }),
      ]),
    ],
    dashboard: [
      count("held", "Reservations held", "Reservas apartadas", "reservations", "held"),
      sum("rate", "Published rates", "Tarifas publicadas", "rates", "price"),
      donut("reservations", "Reservations", "Reservas", "reservations"),
      bars("capacity", "Capacity", "Capacidad", "resources", "capacity"),
    ],
  }),
  defineBlueprint({
    slug: "scheduling",
    presentation: "calendar",
    calendar: { entity: "appointments", resourceField: "resourceId", ...calendarRange },
    entities: [
      entity(
        "resources",
        L("Resource", "Recurso"),
        L("Resources", "Recursos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("role", "Role", "Rol"),
          status([opt("available", "Available", "Disponible"), opt("away", "Away", "Ausente")]),
        ],
        flow(["available", "away"]),
      ),
      entity(
        "appointments",
        L("Appointment", "Cita"),
        L("Appointments", "Citas"),
        [
          rel("resourceId", "Resource", "Recurso", "resources", { required: true }),
          text("person", "Person", "Persona", { required: true }),
          text("reason", "Reason", "Motivo"),
          date("start", "Start", "Inicio", { required: true }),
          date("end", "End", "Fin", { required: true }),
          status([
            opt("booked", "Booked", "Agendada"),
            opt("arrived", "Arrived", "Llegó"),
            opt("done", "Done", "Atendida"),
            opt("cancelled", "Cancelled", "Cancelada"),
          ]),
        ],
        flow(["booked", "arrived", "done"], [{ from: "booked", to: ["cancelled"] }]),
      ),
      entity(
        "waitlist",
        L("Waitlist entry", "Lista de espera"),
        L("Waitlist", "Lista de espera"),
        [
          text("person", "Person", "Persona", { required: true }),
          rel("resourceId", "Resource", "Recurso", "resources"),
          status([opt("waiting", "Waiting", "En espera"), opt("booked", "Booked", "Agendada")]),
        ],
        flow(["waiting", "booked"]),
      ),
    ],
    dashboard: [
      count("today", "Booked", "Agendadas", "appointments", "booked"),
      count("waiting", "Waitlist", "Lista de espera", "waitlist", "waiting"),
      donut("appointments", "Appointments", "Citas", "appointments"),
    ],
  }),
  defineBlueprint({
    slug: "quotation-systems",
    presentation: "ledger",
    entities: [
      entity(
        "quotes",
        L("Quote", "Cotización"),
        L("Quotes", "Cotizaciones"),
        [
          text("number", "Number", "Número", { required: true }),
          text("client", "Client", "Cliente", { required: true }),
          money("amount", "Amount", "Importe", { min: 0 }),
          num("revision", "Revision", "Revisión", { min: 1 }),
          status([
            opt("draft", "Draft", "Borrador"),
            opt("sent", "Sent", "Enviada"),
            opt("accepted", "Accepted", "Aceptada"),
            opt("declined", "Declined", "Rechazada"),
          ]),
        ],
        flow(["draft", "sent", "accepted"], [{ from: "sent", to: ["declined"] }]),
      ),
      entity("lines", L("Line", "Partida"), L("Lines", "Partidas"), [
        rel("quoteId", "Quote", "Cotización", "quotes", { required: true }),
        text("description", "Description", "Descripción", { required: true }),
        money("amount", "Amount", "Importe", { min: 0 }),
      ]),
      entity(
        "approvals",
        L("Approval", "Aprobación"),
        L("Approvals", "Aprobaciones"),
        [
          rel("quoteId", "Quote", "Cotización", "quotes", { required: true }),
          text("approver", "Approver", "Aprobador", { required: true }),
          status([opt("pending", "Pending", "Pendiente"), opt("approved", "Approved", "Aprobada")]),
        ],
        flow(["pending", "approved"]),
      ),
    ],
    dashboard: [
      count("sent", "Quotes out", "Cotizaciones enviadas", "quotes", "sent"),
      sum("amount", "Quoted amount", "Importe cotizado", "quotes", "amount"),
      donut("quotes", "Quotes", "Cotizaciones", "quotes"),
    ],
  }),
  defineBlueprint({
    slug: "procurement",
    presentation: "operations",
    entities: [
      entity(
        "vendors",
        L("Vendor", "Proveedor"),
        L("Vendors", "Proveedores"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("category", "Category", "Categoría"),
          status([opt("approved", "Approved", "Aprobado"), opt("hold", "Hold", "Retenido")]),
        ],
        flow(["approved", "hold"]),
      ),
      entity(
        "requisitions",
        L("Requisition", "Requisición"),
        L("Requisitions", "Requisiciones"),
        [
          text("title", "Title", "Título", { required: true }),
          rel("vendorId", "Vendor", "Proveedor", "vendors", { required: true }),
          money("amount", "Amount", "Importe", { min: 0 }),
          status([
            opt("draft", "Draft", "Borrador"),
            opt("approved", "Approved", "Aprobada"),
            opt("ordered", "Ordered", "Ordenada"),
          ]),
        ],
        flow(["draft", "approved", "ordered"]),
      ),
      entity(
        "purchaseOrders",
        L("Purchase order", "Orden de compra"),
        L("Purchase orders", "Órdenes de compra"),
        [
          rel("requisitionId", "Requisition", "Requisición", "requisitions", { required: true }),
          text("number", "Number", "Número", { required: true }),
          money("amount", "Amount", "Importe"),
          status([
            opt("open", "Open", "Abierta"),
            opt("received", "Received", "Recibida"),
            opt("closed", "Closed", "Cerrada"),
          ]),
        ],
        flow(["open", "received", "closed"]),
      ),
      entity(
        "receipts",
        L("Receipt", "Recepción"),
        L("Receipts", "Recepciones"),
        [
          rel("purchaseOrderId", "Purchase order", "Orden", "purchaseOrders", { required: true }),
          num("quantity", "Quantity", "Cantidad", { min: 1 }),
          status([opt("partial", "Partial", "Parcial"), opt("complete", "Complete", "Completa")]),
        ],
        flow(["partial", "complete"]),
      ),
    ],
    dashboard: [
      count(
        "to-approve",
        "Requisitions to approve",
        "Requisiciones por aprobar",
        "requisitions",
        "draft",
      ),
      sum(
        "open-po",
        "Open purchase value",
        "Valor de compras abiertas",
        "purchaseOrders",
        "amount",
      ),
      donut("orders", "Purchase orders", "Órdenes de compra", "purchaseOrders"),
    ],
  }),
  defineBlueprint({
    slug: "production-planning",
    presentation: "operations",
    entities: [
      entity(
        "demands",
        L("Demand", "Demanda"),
        L("Demands", "Demandas"),
        [
          text("item", "Item", "Artículo", { required: true }),
          num("quantity", "Quantity", "Cantidad", { min: 0 }),
          date("due", "Due", "Vence"),
          status([opt("forecast", "Forecast", "Pronóstico"), opt("firm", "Firm", "En firme")]),
        ],
        flow(["forecast", "firm"]),
      ),
      entity(
        "plans",
        L("Plan", "Plan"),
        L("Plans", "Planes"),
        [
          rel("demandId", "Demand", "Demanda", "demands", { required: true }),
          text("line", "Line", "Línea", { required: true }),
          num("quantity", "Quantity", "Cantidad", { min: 0 }),
          status([
            opt("proposed", "Proposed", "Propuesto"),
            opt("firmed", "Firmed", "Confirmado"),
            opt("short", "Short", "Faltante"),
          ]),
        ],
        flow(["proposed", "firmed"], [{ from: "proposed", to: ["short"] }]),
      ),
      entity("capacity", L("Capacity", "Capacidad"), L("Capacity", "Capacidad"), [
        text("line", "Line", "Línea", { required: true }),
        num("hours", "Hours", "Horas", { min: 0 }),
        num("load", "Load", "Carga", { min: 0 }),
      ]),
      entity(
        "materials",
        L("Material", "Material"),
        L("Materials", "Materiales"),
        [
          text("item", "Item", "Artículo", { required: true }),
          num("required", "Required", "Requerido", { min: 0 }),
          num("onHand", "On hand", "Existencias", { min: 0 }),
          status([opt("covered", "Covered", "Cubierto"), opt("short", "Short", "Faltante")]),
        ],
        flow(["covered", "short"]),
      ),
    ],
    dashboard: [
      count("firm", "Firm demand", "Demanda en firme", "demands", "firm"),
      count("short", "Material shorts", "Faltantes de material", "materials", "short"),
      bars("load", "Line load", "Carga de línea", "capacity", "load"),
      donut("plans", "Plans", "Planes", "plans"),
    ],
  }),
];
