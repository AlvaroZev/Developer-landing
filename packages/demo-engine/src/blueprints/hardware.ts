import {
  L,
  area,
  bars,
  bool,
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

const alertStatus = [opt("open", "Open", "Abierta"), opt("closed", "Closed", "Cerrada")];

function alerts(relation: string) {
  return entity(
    "alerts",
    L("Alert", "Alerta"),
    L("Alerts", "Alertas"),
    [
      rel("deviceId", "Device", "Dispositivo", relation),
      text("message", "Message", "Mensaje", { required: true }),
      status(alertStatus),
    ],
    flow(["open", "closed"]),
  );
}

export const hardwareBlueprints: Blueprint[] = [
  defineBlueprint({
    slug: "industrial-iot",
    presentation: "telemetry",
    hardware: {
      kind: "iot",
      deviceEntity: "devices",
      readingField: "reading",
      thresholdField: "threshold",
    },
    entities: [
      entity(
        "devices",
        L("Device", "Dispositivo"),
        L("Devices", "Dispositivos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("site", "Site", "Sitio"),
          num("reading", "Reading", "Lectura"),
          num("threshold", "Threshold", "Umbral"),
          text("command", "Last command", "Último comando"),
          status([
            opt("online", "Online", "En línea"),
            opt("offline", "Offline", "Fuera de línea"),
            opt("alert", "Alert", "Alerta"),
          ]),
        ],
        flow(["online", "offline"]),
      ),
      entity("readings", L("Reading", "Lectura"), L("Readings", "Lecturas"), [
        rel("deviceId", "Device", "Dispositivo", "devices", { required: true }),
        num("value", "Value", "Valor"),
        date("takenAt", "Taken", "Tomada"),
      ]),
      alerts("devices"),
      entity(
        "commands",
        L("Command", "Comando"),
        L("Commands", "Comandos"),
        [
          rel("deviceId", "Device", "Dispositivo", "devices", { required: true }),
          text("name", "Command", "Comando", { required: true }),
          status([opt("queued", "Queued", "En cola"), opt("sent", "Sent", "Enviado")]),
        ],
        flow(["queued", "sent"]),
      ),
    ],
    dashboard: [
      count("online", "Devices online", "Dispositivos en línea", "devices", "online"),
      count("alerts", "Open alerts", "Alertas abiertas", "alerts", "open"),
      bars("readings", "Readings", "Lecturas", "devices", "reading"),
      donut("devices", "Devices", "Dispositivos", "devices"),
    ],
  }),
  defineBlueprint({
    slug: "smart-agriculture",
    presentation: "telemetry",
    hardware: {
      kind: "agriculture",
      deviceEntity: "probes",
      readingField: "moisture",
      thresholdField: "threshold",
    },
    entities: [
      entity(
        "fields",
        L("Field", "Parcela"),
        L("Fields", "Parcelas"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("crop", "Crop", "Cultivo"),
          num("hectares", "Hectares", "Hectáreas", { min: 0 }),
          status([
            opt("in_season", "In season", "En temporada"),
            opt("fallow", "Fallow", "En descanso"),
          ]),
        ],
        flow(["in_season", "fallow"]),
      ),
      entity(
        "probes",
        L("Probe", "Sonda"),
        L("Probes", "Sondas"),
        [
          rel("fieldId", "Field", "Parcela", "fields", { required: true }),
          num("moisture", "Moisture", "Humedad", { min: 0, max: 100 }),
          num("threshold", "Threshold", "Umbral", { min: 0, max: 100 }),
          status([opt("live", "Live", "En vivo"), opt("alert", "Alert", "Alerta")]),
        ],
        flow(["live", "alert"]),
      ),
      entity(
        "zones",
        L("Zone", "Zona"),
        L("Zones", "Zonas"),
        [
          rel("fieldId", "Field", "Parcela", "fields", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          select("valve", "Valve", "Válvula", [
            opt("closed", "Closed", "Cerrada"),
            opt("open", "Open", "Abierta"),
          ]),
          select("mode", "Mode", "Modo", [
            opt("manual", "Manual", "Manual"),
            opt("auto", "Auto", "Automático"),
          ]),
          num("moisture", "Moisture", "Humedad", { min: 0, max: 100 }),
          num("threshold", "Threshold", "Umbral", { min: 0, max: 100 }),
          status([opt("idle", "Idle", "En espera"), opt("watering", "Watering", "Regando")]),
        ],
        flow(["idle", "watering"]),
      ),
      entity(
        "events",
        L("Event", "Evento"),
        L("Events", "Eventos"),
        [
          rel("zoneId", "Zone", "Zona", "zones"),
          text("message", "Message", "Mensaje", { required: true }),
          status([opt("open", "Open", "Abierto"), opt("closed", "Closed", "Cerrado")]),
        ],
        flow(["open", "closed"]),
      ),
    ],
    dashboard: [
      count("watering", "Zones watering", "Zonas regando", "zones", "watering"),
      bars("moisture", "Soil moisture", "Humedad del suelo", "probes", "moisture"),
      donut("fields", "Fields", "Parcelas", "fields"),
      count("events", "Open events", "Eventos abiertos", "events", "open"),
    ],
  }),
  defineBlueprint({
    slug: "industrial-automation",
    presentation: "control",
    hardware: { kind: "automation", deviceEntity: "cells", readingField: "speed", estop: true },
    entities: [
      entity(
        "cells",
        L("Cell", "Celda"),
        L("Cells", "Celdas"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("recipe", "Recipe", "Receta"),
          num("speed", "Speed", "Velocidad", { min: 0 }),
          select("state", "State", "Estado", [
            opt("running", "Running", "En marcha"),
            opt("stopped", "Stopped", "Detenida"),
            opt("estop", "E-stop", "Parada"),
          ]),
          status([
            opt("running", "Running", "En marcha"),
            opt("stopped", "Stopped", "Detenida"),
            opt("alert", "Alert", "Alerta"),
          ]),
        ],
        flow(["running", "stopped"]),
      ),
      entity("tags", L("Tag", "Tag"), L("Tags", "Tags"), [
        rel("cellId", "Cell", "Celda", "cells", { required: true }),
        text("name", "Name", "Nombre", { required: true }),
        num("value", "Value", "Valor"),
      ]),
      entity(
        "alarms",
        L("Alarm", "Alarma"),
        L("Alarms", "Alarmas"),
        [
          rel("cellId", "Cell", "Celda", "cells", { required: true }),
          text("message", "Message", "Mensaje", { required: true }),
          status([
            opt("open", "Open", "Abierta"),
            opt("acked", "Acknowledged", "Reconocida"),
            opt("cleared", "Cleared", "Cerrada"),
          ]),
        ],
        flow(["open", "acked", "cleared"]),
      ),
      entity(
        "recipes",
        L("Recipe", "Receta"),
        L("Recipes", "Recetas"),
        [
          rel("cellId", "Cell", "Celda", "cells", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          status([opt("released", "Released", "Liberada"), opt("held", "Held", "Retenida")]),
        ],
        flow(["released", "held"]),
      ),
    ],
    dashboard: [
      count("running", "Cells running", "Celdas en marcha", "cells", "running"),
      count("alarms", "Open alarms", "Alarmas abiertas", "alarms", "open"),
      bars("speed", "Cell speed", "Velocidad", "cells", "speed"),
      donut("cells", "Cells", "Celdas", "cells"),
    ],
  }),
  defineBlueprint({
    slug: "robotics",
    presentation: "control",
    hardware: { kind: "robotics", deviceEntity: "robots", readingField: "speed", estop: true },
    entities: [
      entity("robots", L("Robot", "Robot"), L("Robots", "Robots"), [
        text("name", "Name", "Nombre", { required: true }),
        text("zone", "Zone", "Zona"),
        num("x", "X", "X", { min: 0, max: 100 }),
        num("y", "Y", "Y", { min: 0, max: 100 }),
        num("heading", "Heading", "Rumbo", { min: 0, max: 359 }),
        num("speed", "Speed", "Velocidad", { min: 0 }),
        text("mission", "Mission", "Misión"),
        select("state", "State", "Estado", [
          opt("idle", "Idle", "En espera"),
          opt("running", "Running", "En marcha"),
          opt("fault", "Fault", "Falla"),
          opt("estop", "E-stop", "Parada"),
        ]),
      ]),
      entity(
        "missions",
        L("Mission", "Misión"),
        L("Missions", "Misiones"),
        [
          rel("robotId", "Robot", "Robot", "robots", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          status([
            opt("queued", "Queued", "En cola"),
            opt("running", "Running", "En marcha"),
            opt("stopped", "Stopped", "Detenida"),
            opt("done", "Done", "Terminada"),
          ]),
        ],
        flow(["queued", "running", "done"], [{ from: "running", to: ["stopped"] }]),
      ),
      entity(
        "faults",
        L("Fault", "Falla"),
        L("Faults", "Fallas"),
        [
          rel("robotId", "Robot", "Robot", "robots", { required: true }),
          text("message", "Message", "Mensaje", { required: true }),
          status([opt("open", "Open", "Abierta"), opt("cleared", "Cleared", "Cerrada")]),
        ],
        flow(["open", "cleared"]),
      ),
    ],
    dashboard: [
      count("running", "Missions running", "Misiones en marcha", "missions", "running"),
      count("faults", "Open faults", "Fallas abiertas", "faults", "open"),
      bars("speed", "Speed", "Velocidad", "robots", "speed"),
      donut("missions", "Missions", "Misiones", "missions"),
    ],
  }),
  defineBlueprint({
    slug: "embedded-systems",
    presentation: "telemetry",
    hardware: {
      kind: "embedded",
      deviceEntity: "devices",
      readingField: "heap",
      thresholdField: "threshold",
    },
    entities: [
      entity(
        "devices",
        L("Device", "Dispositivo"),
        L("Devices", "Dispositivos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("board", "Board", "Placa"),
          text("firmware", "Firmware", "Firmware"),
          num("heap", "Heap used", "Heap usado", { min: 0, max: 100 }),
          num("threshold", "Heap threshold", "Umbral de heap", { min: 0, max: 100 }),
          select("connectivity", "Connectivity", "Conectividad", [
            opt("online", "Online", "En línea"),
            opt("offline", "Offline", "Fuera de línea"),
          ]),
          num("inputA", "Input A", "Entrada A"),
          status([
            opt("healthy", "Healthy", "Sano"),
            opt("fault", "Fault", "Falla"),
            opt("alert", "Alert", "Alerta"),
          ]),
        ],
        flow(["healthy", "fault"]),
      ),
      entity(
        "diagnostics",
        L("Diagnostic", "Diagnóstico"),
        L("Diagnostics", "Diagnósticos"),
        [
          rel("deviceId", "Device", "Dispositivo", "devices", { required: true }),
          text("result", "Result", "Resultado"),
          status([opt("pass", "Pass", "Aprueba"), opt("fail", "Fail", "Falla")]),
        ],
        flow(["pass", "fail"]),
      ),
      entity("pins", L("Pin", "Pin"), L("Pins", "Pines"), [
        rel("deviceId", "Device", "Dispositivo", "devices", { required: true }),
        text("name", "Name", "Nombre", { required: true }),
        num("value", "Value", "Valor"),
      ]),
      entity(
        "images",
        L("Firmware image", "Imagen de firmware"),
        L("Firmware images", "Imágenes de firmware"),
        [
          rel("deviceId", "Device", "Dispositivo", "devices", { required: true }),
          text("version", "Version", "Versión", { required: true }),
          status([opt("staged", "Staged", "Preparada"), opt("current", "Current", "Actual")]),
        ],
        flow(["staged", "current"]),
      ),
    ],
    dashboard: [
      count("healthy", "Healthy devices", "Dispositivos sanos", "devices", "healthy"),
      bars("heap", "Heap used", "Heap usado", "devices", "heap"),
      donut("diagnostics", "Diagnostics", "Diagnósticos", "diagnostics"),
    ],
  }),
  defineBlueprint({
    slug: "sensor-networks",
    presentation: "telemetry",
    hardware: {
      kind: "sensor",
      deviceEntity: "nodes",
      readingField: "reading",
      thresholdField: "threshold",
    },
    entities: [
      entity(
        "gateways",
        L("Gateway", "Puerta de enlace"),
        L("Gateways", "Puertas de enlace"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("site", "Site", "Sitio"),
          status([opt("up", "Up", "Arriba"), opt("degraded", "Degraded", "Degradada")]),
        ],
        flow(["up", "degraded"]),
      ),
      entity(
        "nodes",
        L("Node", "Nodo"),
        L("Nodes", "Nodos"),
        [
          rel("gatewayId", "Gateway", "Puerta de enlace", "gateways", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          num("battery", "Battery", "Batería", { min: 0, max: 100 }),
          num("reading", "Reading", "Lectura"),
          num("threshold", "Threshold", "Umbral"),
          status([
            opt("online", "Online", "En línea"),
            opt("offline", "Offline", "Fuera de línea"),
            opt("alert", "Alert", "Alerta"),
          ]),
        ],
        flow(["online", "offline"]),
      ),
      entity("readings", L("Reading", "Lectura"), L("Readings", "Lecturas"), [
        rel("nodeId", "Node", "Nodo", "nodes", { required: true }),
        num("value", "Value", "Valor"),
        date("takenAt", "Taken", "Tomada"),
      ]),
      entity(
        "alerts",
        L("Alert", "Alerta"),
        L("Alerts", "Alertas"),
        [
          rel("nodeId", "Node", "Nodo", "nodes"),
          text("message", "Message", "Mensaje", { required: true }),
          status(alertStatus),
        ],
        flow(["open", "closed"]),
      ),
    ],
    dashboard: [
      count("online", "Nodes online", "Nodos en línea", "nodes", "online"),
      count("alerts", "Open alerts", "Alertas abiertas", "alerts", "open"),
      bars("battery", "Battery", "Batería", "nodes", "battery"),
      donut("gateways", "Gateways", "Puertas de enlace", "gateways"),
    ],
  }),
  defineBlueprint({
    slug: "energy-monitoring",
    presentation: "telemetry",
    hardware: {
      kind: "energy",
      deviceEntity: "meters",
      readingField: "power",
      thresholdField: "threshold",
    },
    entities: [
      entity("circuits", L("Circuit", "Circuito"), L("Circuits", "Circuitos"), [
        text("name", "Name", "Nombre", { required: true }),
        num("capacity", "Capacity kW", "Capacidad kW", { min: 0 }),
        num("load", "Load kW", "Carga kW", { min: 0 }),
      ]),
      entity(
        "meters",
        L("Meter", "Medidor"),
        L("Meters", "Medidores"),
        [
          text("name", "Name", "Nombre", { required: true }),
          rel("circuitId", "Circuit", "Circuito", "circuits"),
          num("power", "Power kW", "Potencia kW", { min: 0 }),
          num("energy", "Energy kWh", "Energía kWh", { min: 0 }),
          num("threshold", "Demand limit", "Límite de demanda", { min: 0 }),
          status([opt("normal", "Normal", "Normal"), opt("alert", "Alert", "Alerta")]),
        ],
        flow(["normal", "alert"]),
      ),
      entity("readings", L("Reading", "Lectura"), L("Readings", "Lecturas"), [
        rel("meterId", "Meter", "Medidor", "meters", { required: true }),
        num("power", "Power", "Potencia"),
        num("energy", "Energy", "Energía"),
        date("takenAt", "Taken", "Tomada"),
      ]),
      entity(
        "alerts",
        L("Alert", "Alerta"),
        L("Alerts", "Alertas"),
        [
          rel("meterId", "Meter", "Medidor", "meters"),
          text("message", "Message", "Mensaje", { required: true }),
          status(alertStatus),
        ],
        flow(["open", "closed"]),
      ),
    ],
    dashboard: [
      sum("power", "Site power", "Potencia del sitio", "meters", "power"),
      sum("energy", "Energy", "Energía", "meters", "energy"),
      count("alerts", "Open alerts", "Alertas abiertas", "alerts", "open"),
      bars("load", "Circuit load", "Carga", "circuits", "load"),
    ],
  }),
  defineBlueprint({
    slug: "telemetry-systems",
    presentation: "telemetry",
    hardware: {
      kind: "telemetry",
      deviceEntity: "assets",
      readingField: "reading",
      thresholdField: "threshold",
    },
    entities: [
      entity(
        "assets",
        L("Asset", "Activo"),
        L("Assets", "Activos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("site", "Site", "Sitio"),
          num("reading", "Reading", "Lectura"),
          num("threshold", "Threshold", "Umbral"),
          status([
            opt("reporting", "Reporting", "Reportando"),
            opt("silent", "Silent", "En silencio"),
            opt("alert", "Alert", "Alerta"),
          ]),
        ],
        flow(["reporting", "silent"]),
      ),
      entity("streams", L("Stream", "Flujo"), L("Streams", "Flujos"), [
        rel("assetId", "Asset", "Activo", "assets", { required: true }),
        text("name", "Name", "Nombre", { required: true }),
        text("unit", "Unit", "Unidad"),
      ]),
      entity("readings", L("Reading", "Lectura"), L("Readings", "Lecturas"), [
        rel("assetId", "Asset", "Activo", "assets", { required: true }),
        num("value", "Value", "Valor"),
        date("takenAt", "Taken", "Tomada"),
      ]),
      entity(
        "alerts",
        L("Alert", "Alerta"),
        L("Alerts", "Alertas"),
        [
          rel("assetId", "Asset", "Activo", "assets"),
          text("message", "Message", "Mensaje", { required: true }),
          status(alertStatus),
        ],
        flow(["open", "closed"]),
      ),
    ],
    dashboard: [
      count("reporting", "Assets reporting", "Activos reportando", "assets", "reporting"),
      count("alerts", "Open alerts", "Alertas abiertas", "alerts", "open"),
      bars("readings", "Readings", "Lecturas", "assets", "reading"),
      donut("assets", "Assets", "Activos", "assets"),
    ],
  }),
  defineBlueprint({
    slug: "device-management",
    presentation: "operations",
    hardware: { kind: "integration", deviceEntity: "devices", readingField: "battery" },
    entities: [
      entity(
        "devices",
        L("Device", "Dispositivo"),
        L("Devices", "Dispositivos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("model", "Model", "Modelo"),
          text("firmware", "Firmware", "Firmware"),
          num("battery", "Battery", "Batería", { min: 0, max: 100 }),
          bool("online", "Online", "En línea"),
          status([
            opt("enrolled", "Enrolled", "Registrado"),
            opt("drifted", "Drifted", "Desviado"),
            opt("updated", "Updated", "Actualizado"),
          ]),
        ],
        flow(["enrolled", "drifted", "updated"]),
      ),
      entity(
        "campaigns",
        L("Campaign", "Campaña"),
        L("Campaigns", "Campañas"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("version", "Version", "Versión", { required: true }),
          num("progress", "Progress", "Avance", { min: 0, max: 100 }),
          status([
            opt("draft", "Draft", "Borrador"),
            opt("rolling", "Rolling", "En curso"),
            opt("done", "Done", "Terminada"),
          ]),
        ],
        flow(["draft", "rolling", "done"]),
      ),
      entity(
        "configs",
        L("Config", "Configuración"),
        L("Configs", "Configuraciones"),
        [
          rel("deviceId", "Device", "Dispositivo", "devices", { required: true }),
          text("key", "Key", "Clave", { required: true }),
          text("value", "Value", "Valor"),
          status([opt("desired", "Desired", "Deseada"), opt("applied", "Applied", "Aplicada")]),
        ],
        flow(["desired", "applied"]),
      ),
      entity(
        "health",
        L("Health", "Salud"),
        L("Health", "Salud"),
        [
          rel("deviceId", "Device", "Dispositivo", "devices", { required: true }),
          num("battery", "Battery", "Batería", { min: 0, max: 100 }),
          status([opt("ok", "OK", "Correcto"), opt("attention", "Attention", "Atención")]),
        ],
        flow(["ok", "attention"]),
      ),
    ],
    dashboard: [
      count("drifted", "Drifted devices", "Dispositivos desviados", "devices", "drifted"),
      bars("campaigns", "Campaign progress", "Avance de campañas", "campaigns", "progress"),
      donut("devices", "Devices", "Dispositivos", "devices"),
    ],
  }),
  defineBlueprint({
    slug: "hardware-software-integration",
    presentation: "control",
    hardware: { kind: "integration", deviceEntity: "devices", readingField: "reported" },
    entities: [
      entity(
        "devices",
        L("Device", "Dispositivo"),
        L("Devices", "Dispositivos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("serial", "Serial", "Serie", { required: true }),
          num("shadow", "Desired", "Deseado"),
          num("reported", "Reported", "Reportado"),
          status([
            opt("in_sync", "In sync", "Sincronizado"),
            opt("drifted", "Drifted", "Desviado"),
          ]),
        ],
        flow(["in_sync", "drifted"]),
      ),
      entity(
        "contracts",
        L("Contract", "Contrato"),
        L("Contracts", "Contratos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("version", "Version", "Versión"),
          status([opt("active", "Active", "Activo"), opt("deprecated", "Deprecated", "Obsoleto")]),
        ],
        flow(["active", "deprecated"]),
      ),
      entity(
        "syncs",
        L("Sync", "Sincronización"),
        L("Syncs", "Sincronizaciones"),
        [
          rel("deviceId", "Device", "Dispositivo", "devices", { required: true }),
          text("result", "Result", "Resultado"),
          status([
            opt("pending", "Pending", "Pendiente"),
            opt("ok", "OK", "Correcta"),
            opt("failed", "Failed", "Fallida"),
          ]),
        ],
        flow(["pending", "ok"], [{ from: "pending", to: ["failed"] }]),
      ),
      entity("diffs", L("Diff", "Diferencia"), L("Diffs", "Diferencias"), [
        rel("deviceId", "Device", "Dispositivo", "devices", { required: true }),
        text("field", "Field", "Campo", { required: true }),
        text("desired", "Desired", "Deseado"),
        text("reported", "Reported", "Reportado"),
      ]),
    ],
    dashboard: [
      count("drifted", "Drifted devices", "Dispositivos desviados", "devices", "drifted"),
      count("pending", "Syncs pending", "Sincronizaciones pendientes", "syncs", "pending"),
      bars("reported", "Reported values", "Valores reportados", "devices", "reported"),
      donut("devices", "Devices", "Dispositivos", "devices"),
    ],
  }),
  defineBlueprint({
    slug: "control-systems",
    presentation: "control",
    hardware: { kind: "control", deviceEntity: "loops", readingField: "processValue", estop: true },
    entities: [
      entity(
        "loops",
        L("Loop", "Lazo"),
        L("Loops", "Lazos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          num("processValue", "Process value", "Variable de proceso"),
          num("setpoint", "Setpoint", "Consigna"),
          num("output", "Output", "Salida", { min: 0, max: 100 }),
          bool("interlock", "Interlock", "Enclavamiento"),
          status([
            opt("auto", "Auto", "Automático"),
            opt("manual", "Manual", "Manual"),
            opt("tripped", "Tripped", "Disparado"),
          ]),
        ],
        flow(
          ["auto", "manual"],
          [
            { from: "auto", to: ["tripped"] },
            { from: "manual", to: ["tripped"] },
          ],
        ),
      ),
      entity("actuators", L("Actuator", "Actuador"), L("Actuators", "Actuadores"), [
        rel("loopId", "Loop", "Lazo", "loops", { required: true }),
        text("name", "Name", "Nombre", { required: true }),
        num("position", "Position", "Posición", { min: 0, max: 100 }),
      ]),
      entity(
        "interlocks",
        L("Interlock", "Enclavamiento"),
        L("Interlocks", "Enclavamientos"),
        [
          rel("loopId", "Loop", "Lazo", "loops", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          status([opt("healthy", "Healthy", "Sano"), opt("tripped", "Tripped", "Disparado")]),
        ],
        flow(["healthy", "tripped"]),
      ),
      entity("trends", L("Trend", "Tendencia"), L("Trends", "Tendencias"), [
        rel("loopId", "Loop", "Lazo", "loops", { required: true }),
        num("value", "Value", "Valor"),
        date("takenAt", "Taken", "Tomada"),
      ]),
    ],
    dashboard: [
      count("tripped", "Tripped loops", "Lazos disparados", "loops", "tripped"),
      bars("output", "Output", "Salida", "loops", "output"),
      donut("loops", "Loops", "Lazos", "loops"),
      count(
        "interlocks",
        "Tripped interlocks",
        "Enclavamientos disparados",
        "interlocks",
        "tripped",
      ),
    ],
  }),
];
