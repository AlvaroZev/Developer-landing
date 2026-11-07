import {
  L,
  area,
  bars,
  count,
  date,
  defineBlueprint,
  donut,
  entity,
  flow,
  num,
  opt,
  rel,
  select,
  status,
  sum,
  text,
} from "../dsl";
import type { Blueprint } from "../types";

export const intelligenceBlueprints: Blueprint[] = [
  defineBlueprint({
    slug: "analytics-dashboards",
    presentation: "analytics",
    entities: [
      entity(
        "metrics",
        L("Metric", "Métrica"),
        L("Metrics", "Métricas"),
        [
          text("name", "Name", "Nombre", { required: true }),
          num("value", "Value", "Valor"),
          text("unit", "Unit", "Unidad"),
          num("target", "Target", "Meta"),
          status([opt("steady", "Steady", "Estable"), opt("watch", "Watch", "Vigilancia")]),
        ],
        flow(["steady", "watch"]),
      ),
      entity("snapshots", L("Snapshot", "Foto"), L("Snapshots", "Fotos"), [
        rel("metricId", "Metric", "Métrica", "metrics", { required: true }),
        date("capturedAt", "Captured", "Tomada"),
        num("value", "Value", "Valor"),
      ]),
      entity("notes", L("Note", "Nota"), L("Notes", "Notas"), [
        rel("metricId", "Metric", "Métrica", "metrics", { required: true }),
        text("author", "Author", "Autor"),
        area("body", "Note", "Nota"),
      ]),
    ],
    dashboard: [
      count("watch", "Metrics on watch", "Métricas en vigilancia", "metrics", "watch"),
      bars("values", "Current values", "Valores actuales", "metrics", "value"),
      donut("metrics", "Metrics", "Métricas", "metrics"),
    ],
  }),
  defineBlueprint({
    slug: "business-reports",
    presentation: "analytics",
    entities: [
      entity(
        "reports",
        L("Report", "Informe"),
        L("Reports", "Informes"),
        [
          text("name", "Name", "Nombre", { required: true }),
          select("cadence", "Cadence", "Frecuencia", [
            opt("daily", "Daily", "Diario"),
            opt("weekly", "Weekly", "Semanal"),
            opt("monthly", "Monthly", "Mensual"),
          ]),
          text("owner", "Owner", "Responsable"),
          status([
            opt("draft", "Draft", "Borrador"),
            opt("scheduled", "Scheduled", "Programado"),
            opt("sent", "Sent", "Enviado"),
          ]),
        ],
        flow(["draft", "scheduled", "sent"]),
      ),
      entity(
        "runs",
        L("Run", "Ejecución"),
        L("Runs", "Ejecuciones"),
        [
          rel("reportId", "Report", "Informe", "reports", { required: true }),
          date("finishedAt", "Finished", "Terminó"),
          status([
            opt("queued", "Queued", "En cola"),
            opt("ready", "Ready", "Listo"),
            opt("failed", "Failed", "Fallido"),
          ]),
        ],
        flow(["queued", "ready"], [{ from: "queued", to: ["failed"] }]),
      ),
      entity(
        "recipients",
        L("Recipient", "Destinatario"),
        L("Recipients", "Destinatarios"),
        [
          rel("reportId", "Report", "Informe", "reports", { required: true }),
          text("email", "Email", "Correo", { required: true }),
          status([opt("active", "Active", "Activo"), opt("paused", "Paused", "En pausa")]),
        ],
        flow(["active", "paused"]),
      ),
    ],
    dashboard: [
      count("scheduled", "Scheduled reports", "Informes programados", "reports", "scheduled"),
      count("failed", "Failed runs", "Ejecuciones fallidas", "runs", "failed"),
      donut("reports", "Reports", "Informes", "reports"),
    ],
  }),
  defineBlueprint({
    slug: "monitoring-systems",
    presentation: "telemetry",
    hardware: {
      kind: "telemetry",
      deviceEntity: "checks",
      readingField: "latency",
      thresholdField: "threshold",
    },
    entities: [
      entity(
        "checks",
        L("Check", "Verificación"),
        L("Checks", "Verificaciones"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("target", "Target", "Objetivo", { required: true }),
          num("latency", "Latency", "Latencia", { min: 0 }),
          num("threshold", "Threshold", "Umbral", { min: 0 }),
          status([
            opt("up", "Up", "Arriba"),
            opt("down", "Down", "Caído"),
            opt("alert", "Alert", "Alerta"),
          ]),
        ],
        flow(["up", "down"]),
      ),
      entity(
        "incidents",
        L("Incident", "Incidente"),
        L("Incidents", "Incidentes"),
        [
          rel("checkId", "Check", "Verificación", "checks", { required: true }),
          text("title", "Title", "Título", { required: true }),
          select("severity", "Severity", "Severidad", [
            opt("sev3", "SEV-3", "SEV-3"),
            opt("sev2", "SEV-2", "SEV-2"),
            opt("sev1", "SEV-1", "SEV-1"),
          ]),
          status([
            opt("open", "Open", "Abierto"),
            opt("acknowledged", "Acknowledged", "Reconocido"),
            opt("resolved", "Resolved", "Resuelto"),
          ]),
        ],
        flow(["open", "acknowledged", "resolved"]),
      ),
      entity(
        "shifts",
        L("Shift", "Turno"),
        L("Shifts", "Turnos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("person", "Person", "Persona", { required: true }),
          status([opt("off", "Off", "Libre"), opt("on_call", "On call", "De guardia")]),
        ],
        flow(["off", "on_call"]),
      ),
      entity(
        "alerts",
        L("Alert", "Alerta"),
        L("Alerts", "Alertas"),
        [
          rel("checkId", "Check", "Verificación", "checks"),
          text("message", "Message", "Mensaje", { required: true }),
          status([opt("open", "Open", "Abierta"), opt("closed", "Closed", "Cerrada")]),
        ],
        flow(["open", "closed"]),
      ),
    ],
    dashboard: [
      count("down", "Checks down", "Verificaciones caídas", "checks", "down"),
      count("incidents", "Open incidents", "Incidentes abiertos", "incidents", "open"),
      bars("latency", "Latency", "Latencia", "checks", "latency"),
      donut("checks", "Checks", "Verificaciones", "checks"),
    ],
  }),
  defineBlueprint({
    slug: "data-platforms",
    presentation: "analytics",
    entities: [
      entity(
        "sources",
        L("Source", "Fuente"),
        L("Sources", "Fuentes"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("kind", "Kind", "Tipo"),
          status([opt("healthy", "Healthy", "Sana"), opt("delayed", "Delayed", "Demorada")]),
        ],
        flow(["healthy", "delayed"]),
      ),
      entity(
        "pipelines",
        L("Pipeline", "Canalización"),
        L("Pipelines", "Canalizaciones"),
        [
          rel("sourceId", "Source", "Fuente", "sources", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          status([
            opt("idle", "Idle", "Inactiva"),
            opt("running", "Running", "En ejecución"),
            opt("failed", "Failed", "Fallida"),
            opt("quarantined", "Quarantined", "En cuarentena"),
          ]),
        ],
        flow(
          ["idle", "running"],
          [
            { from: "running", to: ["failed"] },
            { from: "failed", to: ["quarantined"] },
          ],
        ),
      ),
      entity(
        "quality",
        L("Quality check", "Control de calidad"),
        L("Quality checks", "Controles de calidad"),
        [
          rel("pipelineId", "Pipeline", "Canalización", "pipelines", { required: true }),
          text("rule", "Rule", "Regla", { required: true }),
          status([opt("pass", "Pass", "Aprueba"), opt("fail", "Fail", "Falla")]),
        ],
        flow(["pass", "fail"]),
      ),
      entity(
        "datasets",
        L("Dataset", "Conjunto"),
        L("Datasets", "Conjuntos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          num("rows", "Rows", "Filas", { min: 0 }),
          status([opt("published", "Published", "Publicado"), opt("held", "Held", "Retenido")]),
        ],
        flow(["published", "held"]),
      ),
    ],
    dashboard: [
      count("failed", "Failed pipelines", "Canalizaciones fallidas", "pipelines", "failed"),
      count("held", "Held datasets", "Conjuntos retenidos", "datasets", "held"),
      bars("rows", "Dataset rows", "Filas", "datasets", "rows"),
      donut("pipelines", "Pipelines", "Canalizaciones", "pipelines"),
    ],
  }),
  defineBlueprint({
    slug: "ai-assistants",
    presentation: "knowledge",
    knowledge: { entity: "articles", titleField: "title", bodyField: "body" },
    entities: [
      entity(
        "articles",
        L("Article", "Artículo"),
        L("Articles", "Artículos"),
        [
          text("title", "Title", "Título", { required: true }),
          text("product", "Product", "Producto"),
          area("body", "Body", "Contenido", { required: true }),
          status([opt("draft", "Draft", "Borrador"), opt("published", "Published", "Publicado")]),
        ],
        flow(["draft", "published"]),
      ),
      entity(
        "questions",
        L("Question", "Pregunta"),
        L("Questions", "Preguntas"),
        [
          text("prompt", "Question", "Pregunta", { required: true }),
          status([opt("open", "Open", "Abierta"), opt("answered", "Answered", "Respondida")]),
        ],
        flow(["open", "answered"]),
      ),
      entity("ratings", L("Rating", "Valoración"), L("Ratings", "Valoraciones"), [
        rel("questionId", "Question", "Pregunta", "questions"),
        num("score", "Score", "Puntuación", { min: 1, max: 5 }),
        status([opt("recorded", "Recorded", "Registrada")]),
      ]),
    ],
    dashboard: [
      count("published", "Published articles", "Artículos publicados", "articles", "published"),
      count("open", "Open questions", "Preguntas abiertas", "questions", "open"),
      donut("articles", "Articles", "Artículos", "articles"),
    ],
  }),
  defineBlueprint({
    slug: "predictive-analytics",
    presentation: "analytics",
    entities: [
      entity(
        "cases",
        L("Case", "Caso"),
        L("Cases", "Casos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          num("usage", "Usage", "Uso", { min: 0 }),
          num("failures", "Failures", "Fallas", { min: 0 }),
          num("score", "Score", "Puntuación", { min: 0, max: 100, readonly: true }),
          status([
            opt("clear", "Clear", "Despejado"),
            opt("watching", "Watching", "En vigilancia"),
            opt("risk", "Risk", "Riesgo"),
          ]),
        ],
        flow(["clear", "watching", "risk"]),
      ),
      entity("features", L("Feature", "Variable"), L("Features", "Variables"), [
        rel("caseId", "Case", "Caso", "cases", { required: true }),
        text("name", "Name", "Nombre", { required: true }),
        num("weight", "Weight", "Peso"),
      ]),
      entity(
        "alerts",
        L("Watch", "Vigilancia"),
        L("Watches", "Vigilancias"),
        [
          rel("caseId", "Case", "Caso", "cases", { required: true }),
          text("message", "Message", "Mensaje", { required: true }),
          status([opt("open", "Open", "Abierta"), opt("closed", "Closed", "Cerrada")]),
        ],
        flow(["open", "closed"]),
      ),
    ],
    dashboard: [
      count("risk", "Cases at risk", "Casos en riesgo", "cases", "risk"),
      bars("scores", "Scores", "Puntuaciones", "cases", "score"),
      donut("cases", "Cases", "Casos", "cases"),
    ],
  }),
  defineBlueprint({
    slug: "document-processing",
    presentation: "documents",
    extract: { entity: "documents", bodyField: "body" },
    entities: [
      entity(
        "documents",
        L("Document", "Documento"),
        L("Documents", "Documentos"),
        [
          text("title", "Title", "Título", { required: true }),
          area("body", "Body", "Contenido", { required: true }),
          text("extractedEmail", "Extracted email", "Correo extraído", { readonly: true }),
          text("extractedAmount", "Extracted amount", "Importe extraído", { readonly: true }),
          status([
            opt("inbox", "Inbox", "Bandeja"),
            opt("extracted", "Extracted", "Extraído"),
            opt("accepted", "Accepted", "Aceptado"),
          ]),
        ],
        flow(["inbox", "extracted", "accepted"]),
      ),
      entity(
        "templates",
        L("Template", "Plantilla"),
        L("Templates", "Plantillas"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("fields", "Fields", "Campos"),
          status([opt("active", "Active", "Activa"), opt("retired", "Retired", "Retirada")]),
        ],
        flow(["active", "retired"]),
      ),
      entity(
        "exceptions",
        L("Exception", "Excepción"),
        L("Exceptions", "Excepciones"),
        [
          rel("documentId", "Document", "Documento", "documents", { required: true }),
          text("reason", "Reason", "Motivo", { required: true }),
          status([opt("open", "Open", "Abierta"), opt("accepted", "Accepted", "Aceptada")]),
        ],
        flow(["open", "accepted"]),
      ),
    ],
    dashboard: [
      count("inbox", "Inbox", "Bandeja", "documents", "inbox"),
      count("exceptions", "Open exceptions", "Excepciones abiertas", "exceptions", "open"),
      donut("documents", "Documents", "Documentos", "documents"),
    ],
  }),
  defineBlueprint({
    slug: "rag-applications",
    presentation: "knowledge",
    knowledge: { entity: "documents", titleField: "title", bodyField: "body" },
    entities: [
      entity(
        "documents",
        L("Document", "Documento"),
        L("Documents", "Documentos"),
        [
          text("title", "Title", "Título", { required: true }),
          text("collection", "Collection", "Colección"),
          area("body", "Body", "Contenido", { required: true }),
          status([opt("indexed", "Indexed", "Indexado"), opt("held", "Held", "Retenido")]),
        ],
        flow(["indexed", "held"]),
      ),
      entity(
        "queries",
        L("Query", "Consulta"),
        L("Queries", "Consultas"),
        [
          text("prompt", "Question", "Pregunta", { required: true }),
          status([opt("open", "Open", "Abierta"), opt("answered", "Answered", "Respondida")]),
        ],
        flow(["open", "answered"]),
      ),
      entity("citations", L("Citation", "Cita"), L("Citations", "Citas"), [
        rel("documentId", "Document", "Documento", "documents", { required: true }),
        text("excerpt", "Excerpt", "Extracto"),
        num("score", "Score", "Puntuación", { min: 0 }),
      ]),
    ],
    dashboard: [
      count("indexed", "Indexed documents", "Documentos indexados", "documents", "indexed"),
      count("queries", "Open queries", "Consultas abiertas", "queries", "open"),
      donut("documents", "Documents", "Documentos", "documents"),
    ],
  }),
  defineBlueprint({
    slug: "data-acquisition",
    presentation: "telemetry",
    hardware: {
      kind: "telemetry",
      deviceEntity: "channels",
      readingField: "reading",
      thresholdField: "threshold",
    },
    entities: [
      entity(
        "channels",
        L("Channel", "Canal"),
        L("Channels", "Canales"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("unit", "Unit", "Unidad"),
          num("reading", "Reading", "Lectura"),
          num("threshold", "Threshold", "Umbral"),
          status([
            opt("live", "Live", "En vivo"),
            opt("fault", "Fault", "Falla"),
            opt("alert", "Alert", "Alerta"),
          ]),
        ],
        flow(["live", "fault"]),
      ),
      entity("samples", L("Sample", "Muestra"), L("Samples", "Muestras"), [
        rel("channelId", "Channel", "Canal", "channels", { required: true }),
        num("value", "Value", "Valor"),
        date("takenAt", "Taken", "Tomada"),
      ]),
      entity(
        "calibrations",
        L("Calibration", "Calibración"),
        L("Calibrations", "Calibraciones"),
        [
          rel("channelId", "Channel", "Canal", "channels", { required: true }),
          num("offset", "Offset", "Desfase"),
          status([opt("due", "Due", "Pendiente"), opt("done", "Done", "Hecha")]),
        ],
        flow(["due", "done"]),
      ),
      entity(
        "sessions",
        L("Session", "Sesión"),
        L("Sessions", "Sesiones"),
        [
          text("name", "Name", "Nombre", { required: true }),
          status([
            opt("armed", "Armed", "Armada"),
            opt("recording", "Recording", "Grabando"),
            opt("closed", "Closed", "Cerrada"),
          ]),
        ],
        flow(["armed", "recording", "closed"]),
      ),
      entity(
        "alerts",
        L("Alert", "Alerta"),
        L("Alerts", "Alertas"),
        [
          rel("channelId", "Channel", "Canal", "channels"),
          text("message", "Message", "Mensaje"),
          status([opt("open", "Open", "Abierta"), opt("closed", "Closed", "Cerrada")]),
        ],
        flow(["open", "closed"]),
      ),
    ],
    dashboard: [
      count("live", "Live channels", "Canales en vivo", "channels", "live"),
      count("calibration", "Calibrations due", "Calibraciones pendientes", "calibrations", "due"),
      bars("readings", "Readings", "Lecturas", "channels", "reading"),
      donut("channels", "Channels", "Canales", "channels"),
    ],
  }),
  defineBlueprint({
    slug: "decision-support",
    presentation: "analytics",
    entities: [
      entity(
        "cases",
        L("Case", "Caso"),
        L("Cases", "Casos"),
        [
          text("title", "Title", "Título", { required: true }),
          text("owner", "Owner", "Responsable"),
          status([opt("open", "Open", "Abierto"), opt("decided", "Decided", "Decidido")]),
        ],
        flow(["open", "decided"]),
      ),
      entity("options", L("Option", "Opción"), L("Options", "Opciones"), [
        rel("caseId", "Case", "Caso", "cases", { required: true }),
        text("name", "Name", "Nombre", { required: true }),
        num("impact", "Impact", "Impacto", { min: 1, max: 5 }),
        num("effort", "Effort", "Esfuerzo", { min: 1, max: 5 }),
        num("score", "Score", "Puntuación", { readonly: true }),
      ]),
      entity(
        "decisions",
        L("Decision", "Decisión"),
        L("Decisions", "Decisiones"),
        [
          rel("caseId", "Case", "Caso", "cases", { required: true }),
          rel("optionId", "Option", "Opción", "options"),
          area("rationale", "Rationale", "Fundamento"),
          status([
            opt("proposed", "Proposed", "Propuesta"),
            opt("recorded", "Recorded", "Registrada"),
          ]),
        ],
        flow(["proposed", "recorded"]),
      ),
    ],
    dashboard: [
      count("open", "Open cases", "Casos abiertos", "cases", "open"),
      bars("scores", "Option scores", "Puntuaciones", "options", "score"),
      donut("decisions", "Decisions", "Decisiones", "decisions"),
    ],
  }),
];
