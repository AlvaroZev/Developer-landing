import {
  L,
  area,
  bars,
  bool,
  count,
  date,
  defineBlueprint,
  donut,
  email,
  entity,
  flow,
  money,
  num,
  opt,
  pct,
  rel,
  select,
  status,
  sum,
  text,
} from "../dsl";
import type { Blueprint } from "../types";

const active = [opt("active", "Active", "Activo"), opt("inactive", "Inactive", "Inactivo")];

export const businessBlueprints: Blueprint[] = [
  defineBlueprint({
    slug: "crm",
    presentation: "pipeline",
    entities: [
      entity(
        "accounts",
        L("Account", "Cuenta"),
        L("Accounts", "Cuentas"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("owner", "Owner", "Responsable", { required: true }),
          money("value", "Value", "Valor"),
          status([
            opt("new", "New", "Nuevo"),
            opt("qualified", "Qualified", "Calificado"),
            opt("proposal", "Proposal", "Propuesta"),
            opt("won", "Won", "Ganado"),
            opt("lost", "Lost", "Perdido"),
          ]),
        ],
        flow(
          ["new", "qualified", "proposal", "won"],
          [
            { from: "new", to: ["lost"] },
            { from: "qualified", to: ["lost"] },
            { from: "proposal", to: ["lost"] },
          ],
        ),
      ),
      entity(
        "contacts",
        L("Contact", "Contacto"),
        L("Contacts", "Contactos"),
        [
          text("fullName", "Full name", "Nombre completo", { required: true }),
          email("email", "Email", "Correo", { required: true }),
          text("phone", "Phone", "Teléfono"),
          rel("accountId", "Account", "Cuenta", "accounts", { required: true }),
          text("role", "Role", "Rol"),
          status(active),
        ],
        flow(["active", "inactive"]),
      ),
      entity(
        "activities",
        L("Activity", "Actividad"),
        L("Activities", "Actividades"),
        [
          text("subject", "Subject", "Asunto", { required: true }),
          rel("contactId", "Contact", "Contacto", "contacts", { required: true }),
          date("due", "Due", "Vence", { required: true }),
          area("notes", "Notes", "Notas"),
          status([opt("open", "Open", "Abierta"), opt("done", "Done", "Hecha")]),
        ],
        flow(["open", "done"]),
      ),
    ],
    dashboard: [
      count("open-accounts", "Open accounts", "Cuentas abiertas", "accounts", "new"),
      sum("pipeline", "Pipeline value", "Valor del embudo", "accounts", "value"),
      donut("mix", "Account stages", "Etapas de cuentas", "accounts"),
      count("activities", "Open activities", "Actividades abiertas", "activities", "open"),
    ],
  }),
  defineBlueprint({
    slug: "erp",
    presentation: "operations",
    entities: [
      entity(
        "items",
        L("Item", "Artículo"),
        L("Items", "Artículos"),
        [
          text("sku", "SKU", "SKU", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          num("onHand", "On hand", "Existencias", { min: 0 }),
          money("cost", "Cost", "Costo"),
          status([opt("stocked", "Stocked", "En existencia"), opt("short", "Short", "Faltante")]),
        ],
        flow(["stocked", "short"]),
      ),
      entity(
        "purchaseOrders",
        L("Purchase order", "Orden de compra"),
        L("Purchase orders", "Órdenes de compra"),
        [
          text("number", "Number", "Número", { required: true }),
          text("vendor", "Vendor", "Proveedor", { required: true }),
          money("total", "Total", "Total"),
          status([
            opt("draft", "Draft", "Borrador"),
            opt("sent", "Sent", "Enviada"),
            opt("received", "Received", "Recibida"),
          ]),
        ],
        flow(["draft", "sent", "received"]),
      ),
      entity(
        "journals",
        L("Journal", "Asiento"),
        L("Journals", "Asientos"),
        [
          text("reference", "Reference", "Referencia", { required: true }),
          text("account", "Account", "Cuenta", { required: true }),
          money("debit", "Debit", "Debe"),
          money("credit", "Credit", "Haber"),
          status([opt("draft", "Draft", "Borrador"), opt("posted", "Posted", "Contabilizado")]),
        ],
        flow(["draft", "posted"]),
      ),
    ],
    dashboard: [
      count("open-po", "Open purchases", "Compras abiertas", "purchaseOrders", "sent"),
      sum("stock-cost", "Stock at cost", "Existencias a costo", "items", "cost"),
      donut("journals", "Journals", "Asientos", "journals"),
      bars("on-hand", "On hand", "Existencias", "items", "onHand"),
    ],
  }),
  defineBlueprint({
    slug: "project-management",
    presentation: "operations",
    entities: [
      entity(
        "projects",
        L("Project", "Proyecto"),
        L("Projects", "Proyectos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("client", "Client", "Cliente", { required: true }),
          pct("progress", "Progress", "Avance", { readonly: true }),
          status([
            opt("planned", "Planned", "Planificado"),
            opt("active", "Active", "Activo"),
            opt("done", "Done", "Terminado"),
          ]),
        ],
        flow(["planned", "active", "done"]),
      ),
      entity(
        "tasks",
        L("Task", "Tarea"),
        L("Tasks", "Tareas"),
        [
          text("title", "Title", "Título", { required: true }),
          rel("projectId", "Project", "Proyecto", "projects", { required: true }),
          text("owner", "Owner", "Responsable"),
          date("due", "Due", "Vence"),
          status([
            opt("todo", "To do", "Por hacer"),
            opt("doing", "Doing", "En curso"),
            opt("done", "Done", "Hecha"),
          ]),
        ],
        flow(["todo", "doing", "done"]),
      ),
      entity(
        "milestones",
        L("Milestone", "Hito"),
        L("Milestones", "Hitos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          rel("projectId", "Project", "Proyecto", "projects", { required: true }),
          date("due", "Due", "Vence"),
          status([opt("open", "Open", "Abierto"), opt("reached", "Reached", "Alcanzado")]),
        ],
        flow(["open", "reached"]),
      ),
    ],
    dashboard: [
      count("active", "Active projects", "Proyectos activos", "projects", "active"),
      count("tasks", "Open tasks", "Tareas abiertas", "tasks", "todo"),
      donut("task-mix", "Task status", "Estado de tareas", "tasks"),
      bars("progress", "Progress", "Avance", "projects", "progress"),
    ],
  }),
  defineBlueprint({
    slug: "employee-management",
    presentation: "operations",
    entities: [
      entity(
        "employees",
        L("Employee", "Empleado"),
        L("Employees", "Empleados"),
        [
          text("fullName", "Name", "Nombre", { required: true }),
          email("email", "Email", "Correo", { required: true }),
          text("department", "Department", "Departamento"),
          text("role", "Role", "Rol"),
          status([
            opt("active", "Active", "Activo"),
            opt("leave", "On leave", "De licencia"),
            opt("inactive", "Inactive", "Inactivo"),
          ]),
        ],
        flow(["active", "leave", "inactive"]),
      ),
      entity(
        "requests",
        L("Time request", "Solicitud de ausencia"),
        L("Time requests", "Solicitudes de ausencia"),
        [
          rel("employeeId", "Employee", "Empleado", "employees", { required: true }),
          select("kind", "Type", "Tipo", [
            opt("vacation", "Vacation", "Vacaciones"),
            opt("sick", "Sick", "Enfermedad"),
            opt("personal", "Personal", "Personal"),
          ]),
          date("start", "Start", "Inicio", { required: true }),
          date("end", "End", "Fin", { required: true }),
          status([
            opt("requested", "Requested", "Solicitada"),
            opt("approved", "Approved", "Aprobada"),
            opt("declined", "Declined", "Rechazada"),
          ]),
        ],
        flow(["requested", "approved"], [{ from: "requested", to: ["declined"] }]),
      ),
      entity(
        "reviews",
        L("Review", "Evaluación"),
        L("Reviews", "Evaluaciones"),
        [
          rel("employeeId", "Employee", "Empleado", "employees", { required: true }),
          text("cycle", "Cycle", "Ciclo", { required: true }),
          num("score", "Score", "Puntuación", { min: 1, max: 5 }),
          status([opt("draft", "Draft", "Borrador"), opt("shared", "Shared", "Compartida")]),
        ],
        flow(["draft", "shared"]),
      ),
    ],
    dashboard: [
      count("people", "Active people", "Personas activas", "employees", "active"),
      count("away", "Requests waiting", "Solicitudes en espera", "requests", "requested"),
      donut("departments", "Employment", "Situación laboral", "employees"),
      bars("scores", "Review scores", "Puntuaciones", "reviews", "score"),
    ],
  }),
  defineBlueprint({
    slug: "customer-portals",
    presentation: "documents",
    entities: [
      entity(
        "customers",
        L("Customer", "Cliente"),
        L("Customers", "Clientes"),
        [
          text("fullName", "Name", "Nombre", { required: true }),
          email("email", "Email", "Correo", { required: true }),
          text("company", "Company", "Empresa"),
          status(active),
        ],
        flow(["active", "inactive"]),
      ),
      entity(
        "requests",
        L("Request", "Solicitud"),
        L("Requests", "Solicitudes"),
        [
          text("subject", "Subject", "Asunto", { required: true }),
          rel("customerId", "Customer", "Cliente", "customers", { required: true }),
          select("priority", "Priority", "Prioridad", [
            opt("normal", "Normal", "Normal"),
            opt("high", "High", "Alta"),
          ]),
          status([
            opt("open", "Open", "Abierta"),
            opt("waiting", "Waiting", "En espera"),
            opt("resolved", "Resolved", "Resuelta"),
          ]),
        ],
        flow(["open", "waiting", "resolved"]),
      ),
      entity(
        "documents",
        L("Document", "Documento"),
        L("Documents", "Documentos"),
        [
          text("title", "Title", "Título", { required: true }),
          rel("customerId", "Customer", "Cliente", "customers", { required: true }),
          area("body", "Body", "Contenido"),
          status([opt("draft", "Draft", "Borrador"), opt("shared", "Shared", "Compartido")]),
        ],
        flow(["draft", "shared"]),
      ),
    ],
    dashboard: [
      count("open", "Open requests", "Solicitudes abiertas", "requests", "open"),
      count("shared", "Shared documents", "Documentos compartidos", "documents", "shared"),
      donut("requests", "Requests", "Solicitudes", "requests"),
    ],
  }),
  defineBlueprint({
    slug: "vendor-management",
    presentation: "operations",
    entities: [
      entity(
        "vendors",
        L("Vendor", "Proveedor"),
        L("Vendors", "Proveedores"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("category", "Category", "Categoría"),
          num("score", "Score", "Puntuación", { min: 0, max: 100 }),
          status([
            opt("approved", "Approved", "Aprobado"),
            opt("watch", "Watch", "En observación"),
            opt("blocked", "Blocked", "Bloqueado"),
          ]),
        ],
        flow(["approved", "watch", "blocked"]),
      ),
      entity(
        "contracts",
        L("Contract", "Contrato"),
        L("Contracts", "Contratos"),
        [
          rel("vendorId", "Vendor", "Proveedor", "vendors", { required: true }),
          text("title", "Title", "Título", { required: true }),
          date("renewsOn", "Renews", "Renovación"),
          money("value", "Value", "Valor"),
          status([
            opt("draft", "Draft", "Borrador"),
            opt("active", "Active", "Activo"),
            opt("expired", "Expired", "Vencido"),
          ]),
        ],
        flow(["draft", "active", "expired"]),
      ),
      entity(
        "deliveries",
        L("Delivery", "Entrega"),
        L("Deliveries", "Entregas"),
        [
          rel("vendorId", "Vendor", "Proveedor", "vendors", { required: true }),
          text("reference", "Reference", "Referencia", { required: true }),
          bool("onTime", "On time", "A tiempo"),
          status([
            opt("due", "Due", "Pendiente"),
            opt("received", "Received", "Recibida"),
            opt("late", "Late", "Tarde"),
          ]),
        ],
        flow(["due", "received"], [{ from: "due", to: ["late"] }]),
      ),
    ],
    dashboard: [
      count("watch", "Vendors on watch", "Proveedores en observación", "vendors", "watch"),
      sum(
        "contracted",
        "Active contract value",
        "Valor de contratos activos",
        "contracts",
        "value",
      ),
      donut("vendors", "Vendor status", "Estado de proveedores", "vendors"),
    ],
  }),
  defineBlueprint({
    slug: "business-intelligence",
    presentation: "analytics",
    entities: [
      entity(
        "measures",
        L("Measure", "Indicador"),
        L("Measures", "Indicadores"),
        [
          text("name", "Name", "Nombre", { required: true }),
          num("value", "Value", "Valor"),
          text("unit", "Unit", "Unidad"),
          num("target", "Target", "Meta"),
          status([
            opt("healthy", "Healthy", "Sano"),
            opt("watch", "Watch", "Vigilancia"),
            opt("off", "Off target", "Fuera de meta"),
          ]),
        ],
        flow(["healthy", "watch", "off"]),
      ),
      entity("breakdowns", L("Breakdown", "Desglose"), L("Breakdowns", "Desgloses"), [
        rel("measureId", "Measure", "Indicador", "measures", { required: true }),
        text("segment", "Segment", "Segmento", { required: true }),
        num("value", "Value", "Valor"),
      ]),
      entity(
        "exceptions",
        L("Exception", "Excepción"),
        L("Exceptions", "Excepciones"),
        [
          rel("measureId", "Measure", "Indicador", "measures", { required: true }),
          area("note", "Note", "Nota"),
          status([opt("open", "Open", "Abierta"), opt("explained", "Explained", "Explicada")]),
        ],
        flow(["open", "explained"]),
      ),
    ],
    dashboard: [
      count("watch", "Measures on watch", "Indicadores en vigilancia", "measures", "watch"),
      count("exceptions", "Open exceptions", "Excepciones abiertas", "exceptions", "open"),
      bars("values", "Measure values", "Valores", "measures", "value"),
      donut("health", "Health", "Salud", "measures"),
    ],
  }),
  defineBlueprint({
    slug: "workflow-management",
    presentation: "operations",
    entities: [
      entity(
        "cases",
        L("Case", "Caso"),
        L("Cases", "Casos"),
        [
          text("title", "Title", "Título", { required: true }),
          text("owner", "Owner", "Responsable", { required: true }),
          text("step", "Step", "Etapa"),
          status([
            opt("new", "New", "Nuevo"),
            opt("active", "Active", "Activo"),
            opt("waiting", "Waiting", "En espera"),
            opt("closed", "Closed", "Cerrado"),
          ]),
        ],
        flow(["new", "active", "waiting", "closed"]),
      ),
      entity(
        "steps",
        L("Step", "Paso"),
        L("Steps", "Pasos"),
        [
          rel("caseId", "Case", "Caso", "cases", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          status([opt("pending", "Pending", "Pendiente"), opt("done", "Done", "Hecho")]),
        ],
        flow(["pending", "done"]),
      ),
      entity(
        "clocks",
        L("SLA clock", "Reloj de servicio"),
        L("SLA clocks", "Relojes de servicio"),
        [
          rel("caseId", "Case", "Caso", "cases", { required: true }),
          date("due", "Due", "Vence", { required: true }),
          status([
            opt("inside", "Inside SLA", "Dentro del acuerdo"),
            opt("breached", "Breached", "Incumplido"),
          ]),
        ],
        flow(["inside", "breached"]),
      ),
    ],
    dashboard: [
      count("active", "Active cases", "Casos activos", "cases", "active"),
      count("breached", "Breached clocks", "Relojes incumplidos", "clocks", "breached"),
      donut("cases", "Cases", "Casos", "cases"),
    ],
  }),
  defineBlueprint({
    slug: "document-management",
    presentation: "documents",
    entities: [
      entity("folders", L("Folder", "Carpeta"), L("Folders", "Carpetas"), [
        text("name", "Name", "Nombre", { required: true }),
        num("count", "Documents", "Documentos", { min: 0 }),
      ]),
      entity(
        "documents",
        L("Document", "Documento"),
        L("Documents", "Documentos"),
        [
          text("title", "Title", "Título", { required: true }),
          text("owner", "Owner", "Responsable"),
          rel("folderId", "Folder", "Carpeta", "folders"),
          num("version", "Version", "Versión", { min: 1 }),
          area("body", "Body", "Contenido"),
          status([
            opt("draft", "Draft", "Borrador"),
            opt("in_review", "In review", "En revisión"),
            opt("approved", "Approved", "Aprobado"),
          ]),
        ],
        flow(["draft", "in_review", "approved"]),
      ),
      entity(
        "reviews",
        L("Review", "Revisión"),
        L("Reviews", "Revisiones"),
        [
          rel("documentId", "Document", "Documento", "documents", { required: true }),
          text("reviewer", "Reviewer", "Revisor", { required: true }),
          status([
            opt("pending", "Pending", "Pendiente"),
            opt("approved", "Approved", "Aprobada"),
            opt("changes", "Changes", "Cambios"),
          ]),
        ],
        flow(["pending", "approved"], [{ from: "pending", to: ["changes"] }]),
      ),
    ],
    dashboard: [
      count("review", "In review", "En revisión", "documents", "in_review"),
      count("pending", "Reviews waiting", "Revisiones en espera", "reviews", "pending"),
      donut("docs", "Documents", "Documentos", "documents"),
    ],
  }),
  defineBlueprint({
    slug: "administrative-systems",
    presentation: "operations",
    entities: [
      entity(
        "policies",
        L("Policy", "Política"),
        L("Policies", "Políticas"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("owner", "Owner", "Responsable"),
          status([opt("active", "Active", "Activa"), opt("retired", "Retired", "Retirada")]),
        ],
        flow(["active", "retired"]),
      ),
      entity(
        "requests",
        L("Request", "Solicitud"),
        L("Requests", "Solicitudes"),
        [
          text("title", "Title", "Título", { required: true }),
          text("requester", "Requester", "Solicitante", { required: true }),
          text("category", "Category", "Categoría"),
          money("amount", "Amount", "Importe"),
          status([
            opt("submitted", "Submitted", "Enviada"),
            opt("approved", "Approved", "Aprobada"),
            opt("rejected", "Rejected", "Rechazada"),
          ]),
        ],
        flow(["submitted", "approved"], [{ from: "submitted", to: ["rejected"] }]),
      ),
      entity(
        "assets",
        L("Asset", "Activo"),
        L("Assets", "Activos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("assignee", "Assignee", "Asignado a"),
          status([opt("spare", "Spare", "Disponible"), opt("assigned", "Assigned", "Asignado")]),
        ],
        flow(["spare", "assigned"]),
      ),
    ],
    dashboard: [
      count("waiting", "Waiting approval", "Pendientes de aprobación", "requests", "submitted"),
      sum("requested", "Requested amount", "Importe solicitado", "requests", "amount"),
      donut("requests", "Requests", "Solicitudes", "requests"),
    ],
  }),
];
