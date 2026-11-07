import type { LocaleCopy, SolutionCategory, SolutionDefinition } from "./types";

function solution(
  slug: string,
  category: SolutionCategory,
  name: LocaleCopy,
  description: LocaleCopy,
  integrations: string[],
  workflows: LocaleCopy[],
): SolutionDefinition {
  return { slug, category, name, description, integrations, workflows };
}

const en = (en: string, es: string): LocaleCopy => ({ en, es });

export const solutions: readonly SolutionDefinition[] = [
  solution(
    "crm",
    "business",
    en("CRM", "CRM"),
    en(
      "Accounts, people, and the next conversation in one pipeline.",
      "Cuentas, personas y la siguiente conversación en un solo embudo.",
    ),
    ["Email", "Calendar"],
    [
      en("Qualify an account", "Calificar una cuenta"),
      en("Complete an activity", "Completar una actividad"),
    ],
  ),
  solution(
    "erp",
    "business",
    en("ERP", "ERP"),
    en(
      "Orders, stock, and the ledger of a single operation.",
      "Pedidos, existencias y el libro de una sola operación.",
    ),
    ["Accounting", "Purchasing"],
    [
      en("Post a journal", "Contabilizar un asiento"),
      en("Receive a purchase", "Recibir una compra"),
    ],
  ),
  solution(
    "project-management",
    "business",
    en("Project Management", "Gestión de proyectos"),
    en(
      "Projects, tasks, and a progress figure that comes from the work.",
      "Proyectos, tareas y un avance que sale del trabajo.",
    ),
    ["Files", "Time"],
    [en("Advance a task", "Avanzar una tarea"), en("Roll up progress", "Consolidar el avance")],
  ),
  solution(
    "employee-management",
    "business",
    en("Employee Management", "Gestión de personal"),
    en(
      "People, time away, and the reviews that follow the work.",
      "Personas, ausencias y las evaluaciones que siguen al trabajo.",
    ),
    ["Payroll", "Calendar"],
    [
      en("Approve time off", "Aprobar una ausencia"),
      en("Record a review", "Registrar una evaluación"),
    ],
  ),
  solution(
    "customer-portals",
    "business",
    en("Customer Portals", "Portales de clientes"),
    en(
      "A place for the customer to ask, read, and follow a request.",
      "Un lugar para que el cliente pregunte, lea y siga una solicitud.",
    ),
    ["Identity", "Documents"],
    [
      en("Open a request", "Abrir una solicitud"),
      en("Publish a document", "Publicar un documento"),
    ],
  ),
  solution(
    "vendor-management",
    "business",
    en("Vendor Management", "Gestión de proveedores"),
    en(
      "Vendors, contracts, and a score that changes with delivery.",
      "Proveedores, contratos y una puntuación que cambia con las entregas.",
    ),
    ["Purchasing", "Quality"],
    [en("Score a delivery", "Evaluar una entrega"), en("Renew a contract", "Renovar un contrato")],
  ),
  solution(
    "business-intelligence",
    "business",
    en("Business Intelligence", "Inteligencia de negocio"),
    en(
      "Measures, breakdowns, and the exceptions worth a meeting.",
      "Indicadores, desgloses y las excepciones que merecen una reunión.",
    ),
    ["Warehouse", "Spreadsheets"],
    [
      en("Refresh a measure", "Actualizar un indicador"),
      en("Open an exception", "Abrir una excepción"),
    ],
  ),
  solution(
    "workflow-management",
    "business",
    en("Workflow Management", "Gestión de flujos"),
    en(
      "Cases moving through steps, with an owner at each one.",
      "Casos que avanzan por etapas, con un responsable en cada una.",
    ),
    ["Email", "Tasks"],
    [
      en("Advance a case", "Avanzar un caso"),
      en("Breach an SLA", "Incumplir un acuerdo de servicio"),
    ],
  ),
  solution(
    "document-management",
    "business",
    en("Document Management", "Gestión documental"),
    en(
      "Files, versions, and a review that actually finishes.",
      "Archivos, versiones y una revisión que sí termina.",
    ),
    ["Storage", "E-sign"],
    [en("Request review", "Solicitar revisión"), en("Approve a version", "Aprobar una versión")],
  ),
  solution(
    "administrative-systems",
    "business",
    en("Administrative Systems", "Sistemas administrativos"),
    en(
      "Internal requests, approvals, and the policy behind them.",
      "Solicitudes internas, aprobaciones y la política que las respalda.",
    ),
    ["Identity", "Finance"],
    [
      en("Submit a request", "Enviar una solicitud"),
      en("Approve a request", "Aprobar una solicitud"),
    ],
  ),
  solution(
    "ecommerce",
    "commerce",
    en("E-commerce", "Comercio electrónico"),
    en(
      "A catalog, a basket, and an order that moves stock.",
      "Un catálogo, un carrito y un pedido que mueve existencias.",
    ),
    ["Payments", "Tax"],
    [en("Place an order", "Registrar un pedido"), en("Update stock", "Actualizar existencias")],
  ),
  solution(
    "marketplaces",
    "commerce",
    en("Marketplaces", "Mercados"),
    en(
      "Sellers, listings, orders, and the fee taken on the way out.",
      "Vendedores, anuncios, pedidos y la comisión de salida.",
    ),
    ["Payments", "KYC"],
    [en("Release a payout", "Liberar un pago"), en("Resolve a dispute", "Resolver una disputa")],
  ),
  solution(
    "point-of-sale",
    "commerce",
    en("Point of Sale", "Punto de venta"),
    en(
      "A counter, a ticket, and the drawer at the end of a shift.",
      "Un mostrador, un ticket y la caja al cierre del turno.",
    ),
    ["Payments", "Hardware"],
    [en("Ring a sale", "Registrar una venta"), en("Close a shift", "Cerrar un turno")],
  ),
  solution(
    "inventory-management",
    "commerce",
    en("Inventory Management", "Gestión de inventario"),
    en(
      "Stock by place, movements, and the reorder line.",
      "Existencias por lugar, movimientos y el punto de reposición.",
    ),
    ["Barcode", "Purchasing"],
    [en("Move stock", "Mover existencias"), en("Raise a reorder", "Generar una reposición")],
  ),
  solution(
    "order-management",
    "commerce",
    en("Order Management", "Gestión de pedidos"),
    en(
      "Orders allocated, shipped, and exceptioned on purpose.",
      "Pedidos asignados, enviados y con excepciones deliberadas.",
    ),
    ["Warehouse", "Carriers"],
    [en("Allocate an order", "Asignar un pedido"), en("Ship an order", "Enviar un pedido")],
  ),
  solution(
    "subscription-management",
    "commerce",
    en("Subscription Management", "Gestión de suscripciones"),
    en(
      "Plans, renewals, and the usage that explains the invoice.",
      "Planes, renovaciones y el uso que explica la factura.",
    ),
    ["Billing", "Tax"],
    [
      en("Change a plan", "Cambiar de plan"),
      en("Cancel a subscription", "Cancelar una suscripción"),
    ],
  ),
  solution(
    "billing",
    "commerce",
    en("Billing", "Facturación"),
    en(
      "Invoices, balances, and a payment that clears the number.",
      "Facturas, saldos y un pago que deja el número en cero.",
    ),
    ["Payments", "Accounting"],
    [en("Issue an invoice", "Emitir una factura"), en("Record a payment", "Registrar un pago")],
  ),
  solution(
    "payment-systems",
    "commerce",
    en("Payment Systems", "Sistemas de pago"),
    en(
      "Charges, refunds, and the disputes that follow them.",
      "Cobros, reembolsos y las disputas que vienen después.",
    ),
    ["Acquiring", "Ledger"],
    [en("Settle a payment", "Liquidar un pago"), en("Refund a charge", "Reembolsar un cobro")],
  ),
  solution(
    "product-catalogs",
    "commerce",
    en("Product Catalogs", "Catálogos de productos"),
    en(
      "Products, variants, and a price that knows its cost.",
      "Productos, variantes y un precio que conoce su costo.",
    ),
    ["PIM", "Channels"],
    [
      en("Publish a variant", "Publicar una variante"),
      en("Reprice a list", "Recalcular una lista"),
    ],
  ),
  solution(
    "customer-management",
    "commerce",
    en("Customer Management", "Gestión de clientes"),
    en(
      "Customers, conversations, and the loyalty they have earned.",
      "Clientes, conversaciones y la fidelidad que han ganado.",
    ),
    ["CRM", "Support"],
    [
      en("Log an interaction", "Registrar una interacción"),
      en("Adjust loyalty", "Ajustar fidelidad"),
    ],
  ),
  solution(
    "warehouse-management",
    "operations",
    en("Warehouse Management", "Gestión de almacenes"),
    en(
      "Locations, receipts, and picks that change the bin.",
      "Ubicaciones, recepciones y picks que cambian el hueco.",
    ),
    ["Barcode", "Carriers"],
    [en("Receive stock", "Recibir mercancía"), en("Confirm a pick", "Confirmar un pick")],
  ),
  solution(
    "fleet-management",
    "operations",
    en("Fleet Management", "Gestión de flotas"),
    en(
      "Vehicles, drivers, trips, and the maintenance in between.",
      "Vehículos, conductores, viajes y el mantenimiento entre ellos.",
    ),
    ["Telematics", "Fuel"],
    [en("Assign a trip", "Asignar un viaje"), en("Ground a vehicle", "Retirar un vehículo")],
  ),
  solution(
    "logistics-management",
    "operations",
    en("Logistics Management", "Gestión logística"),
    en(
      "Shipments, lanes, and the exceptions on the road.",
      "Envíos, rutas y las excepciones en camino.",
    ),
    ["Carriers", "Tracking"],
    [
      en("Tender a shipment", "Asignar un envío"),
      en("Record an exception", "Registrar una excepción"),
    ],
  ),
  solution(
    "manufacturing-execution",
    "operations",
    en("Manufacturing Execution", "Ejecución de manufactura"),
    en(
      "Work orders, lines, downtime, and what actually left the cell.",
      "Órdenes, líneas, paros y lo que realmente salió de la celda.",
    ),
    ["Machines", "Quality"],
    [en("Start a work order", "Iniciar una orden"), en("Record downtime", "Registrar un paro")],
  ),
  solution(
    "maintenance-management",
    "operations",
    en("Maintenance Management", "Gestión de mantenimiento"),
    en(
      "Assets, work, parts, and the schedule that prevents the failure.",
      "Activos, trabajo, repuestos y el plan que evita la falla.",
    ),
    ["Sensors", "Purchasing"],
    [
      en("Open a work order", "Abrir una orden"),
      en("Complete maintenance", "Completar el mantenimiento"),
    ],
  ),
  solution(
    "booking-reservations",
    "operations",
    en("Booking and Reservations", "Reservas"),
    en(
      "Resources, reservations, and the hours that cannot be double sold.",
      "Recursos, reservas y las horas que no se pueden vender dos veces.",
    ),
    ["Payments", "Calendar"],
    [
      en("Hold a reservation", "Apartar una reserva"),
      en("Check a guest in", "Registrar la llegada"),
    ],
  ),
  solution(
    "scheduling",
    "operations",
    en("Scheduling", "Programación"),
    en(
      "People, rooms, and appointments that refuse to overlap.",
      "Personas, salas y citas que no se dejan solapar.",
    ),
    ["Calendar", "Notifications"],
    [en("Book an appointment", "Agendar una cita"), en("Move an appointment", "Mover una cita")],
  ),
  solution(
    "quotation-systems",
    "operations",
    en("Quotation Systems", "Sistemas de cotización"),
    en(
      "Quotes, revisions, and the moment a number becomes work.",
      "Cotizaciones, revisiones y el momento en que un número se vuelve trabajo.",
    ),
    ["CRM", "Pricing"],
    [
      en("Revise a quote", "Revisar una cotización"),
      en("Accept a quote", "Aceptar una cotización"),
    ],
  ),
  solution(
    "procurement",
    "operations",
    en("Procurement", "Abastecimiento"),
    en(
      "Requisitions, purchase orders, and the receipt that closes them.",
      "Requisiciones, órdenes de compra y la recepción que las cierra.",
    ),
    ["Vendors", "Inventory"],
    [
      en("Approve a requisition", "Aprobar una requisición"),
      en("Receive a purchase", "Recibir una compra"),
    ],
  ),
  solution(
    "production-planning",
    "operations",
    en("Production Planning", "Planificación de producción"),
    en(
      "Demand, capacity, and the material the plan assumes is there.",
      "Demanda, capacidad y el material que el plan da por presente.",
    ),
    ["ERP", "MES"],
    [en("Firm a plan", "Firmar un plan"), en("Flag a shortage", "Marcar un faltante")],
  ),
  solution(
    "analytics-dashboards",
    "intelligence",
    en("Analytics Dashboards", "Tableros analíticos"),
    en(
      "The few numbers an operator checks before the day gets away.",
      "Los pocos números que un operador revisa antes de que se le vaya el día.",
    ),
    ["Warehouse", "Events"],
    [en("Refresh a snapshot", "Actualizar una foto"), en("Annotate a shift", "Anotar un turno")],
  ),
  solution(
    "business-reports",
    "intelligence",
    en("Business Reports", "Informes de negocio"),
    en(
      "Reports on a schedule, with a person who is meant to read them.",
      "Informes programados, con una persona que debe leerlos.",
    ),
    ["Email", "Warehouse"],
    [en("Run a report", "Ejecutar un informe"), en("Distribute a report", "Distribuir un informe")],
  ),
  solution(
    "monitoring-systems",
    "intelligence",
    en("Monitoring Systems", "Sistemas de monitoreo"),
    en(
      "Checks, incidents, and the person on call.",
      "Verificaciones, incidentes y la persona de guardia.",
    ),
    ["Alerts", "Status page"],
    [
      en("Open an incident", "Abrir un incidente"),
      en("Acknowledge a check", "Reconocer una verificación"),
    ],
  ),
  solution(
    "data-platforms",
    "intelligence",
    en("Data Platforms", "Plataformas de datos"),
    en(
      "Sources, pipelines, and the quality check that stops a bad load.",
      "Fuentes, canalizaciones y el control de calidad que detiene una carga mala.",
    ),
    ["Storage", "Orchestration"],
    [
      en("Run a pipeline", "Ejecutar una canalización"),
      en("Quarantine a batch", "Poner un lote en cuarentena"),
    ],
  ),
  solution(
    "ai-assistants",
    "intelligence",
    en("AI Assistants", "Asistentes de IA"),
    en(
      "A showroom assistant that answers from the documents in front of it.",
      "Un asistente de showroom que responde con los documentos que tiene delante.",
    ),
    ["Knowledge base"],
    [en("Ask a question", "Hacer una pregunta"), en("Rate an answer", "Valorar una respuesta")],
  ),
  solution(
    "predictive-analytics",
    "intelligence",
    en("Predictive Analytics", "Analítica predictiva"),
    en(
      "A score you can recalculate, with the inputs left visible.",
      "Una puntuación que se puede recalcular, con las entradas a la vista.",
    ),
    ["Features", "Alerts"],
    [en("Score a case", "Puntuar un caso"), en("Raise a watch", "Activar una vigilancia")],
  ),
  solution(
    "document-processing",
    "intelligence",
    en("Document Processing", "Procesamiento de documentos"),
    en(
      "A document in, and the fields a clerk would have typed.",
      "Un documento entra y salen los campos que un analista habría escrito.",
    ),
    ["Storage", "OCR"],
    [en("Extract fields", "Extraer campos"), en("Accept an exception", "Aceptar una excepción")],
  ),
  solution(
    "rag-applications",
    "intelligence",
    en("RAG Applications", "Aplicaciones RAG"),
    en(
      "A question, the passages that matched, and nothing invented beyond them.",
      "Una pregunta, los pasajes que coincidieron y nada inventado fuera de ellos.",
    ),
    ["Search", "Documents"],
    [en("Retrieve passages", "Recuperar pasajes"), en("Cite a source", "Citar una fuente")],
  ),
  solution(
    "data-acquisition",
    "intelligence",
    en("Data Acquisition", "Adquisición de datos"),
    en(
      "Channels, samples, and the calibration that makes them believable.",
      "Canales, muestras y la calibración que las vuelve creíbles.",
    ),
    ["DAQ hardware", "Historians"],
    [
      en("Take a sample", "Tomar una muestra"),
      en("Record a calibration", "Registrar una calibración"),
    ],
  ),
  solution(
    "decision-support",
    "intelligence",
    en("Decision Support", "Apoyo a decisiones"),
    en(
      "A case, the criteria, and a recommendation you can disagree with.",
      "Un caso, los criterios y una recomendación con la que se puede disentir.",
    ),
    ["Rules", "Data"],
    [
      en("Score the options", "Puntuar las opciones"),
      en("Record the decision", "Registrar la decisión"),
    ],
  ),
  solution(
    "industrial-iot",
    "hardware",
    en("Industrial IoT", "IoT industrial"),
    en(
      "Devices, readings, thresholds, and a command with a name.",
      "Dispositivos, lecturas, umbrales y un comando con nombre.",
    ),
    ["MQTT", "Historians"],
    [
      en("Ingest a reading", "Ingerir una lectura"),
      en("Raise a threshold alert", "Generar una alerta de umbral"),
    ],
  ),
  solution(
    "smart-agriculture",
    "hardware",
    en("Smart Agriculture", "Agricultura inteligente"),
    en(
      "Soil, weather, and a valve that opens when the field asks.",
      "Suelo, clima y una válvula que se abre cuando el campo lo pide.",
    ),
    ["Sensors", "Irrigation"],
    [en("Read a probe", "Leer una sonda"), en("Change a valve", "Cambiar una válvula")],
  ),
  solution(
    "industrial-automation",
    "hardware",
    en("Industrial Automation", "Automatización industrial"),
    en(
      "Cells, tags, alarms, and a stop that overrides the recipe.",
      "Celdas, tags, alarmas y una parada que anula la receta.",
    ),
    ["PLC", "SCADA"],
    [en("Acknowledge an alarm", "Reconocer una alarma"), en("Stop a cell", "Detener una celda")],
  ),
  solution(
    "robotics",
    "hardware",
    en("Robotics", "Robótica"),
    en(
      "Pose, mission, and an emergency stop that drops the speed to zero.",
      "Posición, misión y una parada de emergencia que deja la velocidad en cero.",
    ),
    ["Controllers", "Safety"],
    [en("Run a mission", "Ejecutar una misión"), en("Emergency stop", "Parada de emergencia")],
  ),
  solution(
    "embedded-systems",
    "hardware",
    en("Embedded Systems", "Sistemas embebidos"),
    en(
      "Firmware, diagnostics, and the inputs the board can actually see.",
      "Firmware, diagnósticos y las entradas que la placa realmente ve.",
    ),
    ["Serial", "OTA"],
    [
      en("Run diagnostics", "Ejecutar diagnósticos"),
      en("Record firmware", "Registrar el firmware"),
    ],
  ),
  solution(
    "sensor-networks",
    "hardware",
    en("Sensor Networks", "Redes de sensores"),
    en(
      "Gateways, nodes, and the reading that missed its window.",
      "Puertas de enlace, nodos y la lectura que perdió su ventana.",
    ),
    ["LoRa", "Gateways"],
    [
      en("Ingest a node", "Ingerir un nodo"),
      en("Mark a node offline", "Marcar un nodo fuera de línea"),
    ],
  ),
  solution(
    "energy-monitoring",
    "hardware",
    en("Energy Monitoring", "Monitoreo de energía"),
    en(
      "Meters, circuits, and a load that should not cross the line.",
      "Medidores, circuitos y una carga que no debería cruzar el límite.",
    ),
    ["Meters", "Tariffs"],
    [en("Read a meter", "Leer un medidor"), en("Alert on demand", "Alertar por demanda")],
  ),
  solution(
    "telemetry-systems",
    "hardware",
    en("Telemetry Systems", "Sistemas de telemetría"),
    en(
      "Assets reporting in, with a threshold and a history.",
      "Activos que reportan, con umbral e historial.",
    ),
    ["Cellular", "Historians"],
    [en("Ingest telemetry", "Ingerir telemetría"), en("Cross a threshold", "Cruzar un umbral")],
  ),
  solution(
    "device-management",
    "hardware",
    en("Device Management", "Gestión de dispositivos"),
    en(
      "A fleet of devices, a config, and a firmware campaign.",
      "Una flota de dispositivos, una configuración y una campaña de firmware.",
    ),
    ["OTA", "MDM"],
    [
      en("Push a config", "Enviar una configuración"),
      en("Advance a campaign", "Avanzar una campaña"),
    ],
  ),
  solution(
    "hardware-software-integration",
    "hardware",
    en("Hardware / Software Integration", "Integración hardware y software"),
    en(
      "The device, the contract, and the sync that proves they agree.",
      "El dispositivo, el contrato y la sincronización que demuestra que coinciden.",
    ),
    ["APIs", "Device shadow"],
    [en("Run a sync", "Ejecutar una sincronización"), en("Diff a shadow", "Comparar la sombra")],
  ),
  solution(
    "control-systems",
    "hardware",
    en("Control Systems", "Sistemas de control"),
    en(
      "A loop, a setpoint, and an interlock that forces the output to zero.",
      "Un lazo, un punto de consigna y un enclavamiento que fuerza la salida a cero.",
    ),
    ["PLC", "Safety"],
    [en("Step the loop", "Avanzar el lazo"), en("Trip an interlock", "Disparar un enclavamiento")],
  ),
];

/**
 * Explicit industry/solution pairs. Selectors, routes, and tests read this.
 * Do not generate the cartesian product. Custom industry has no demonstration;
 * it leads to the inquiry.
 */
export const compatibility: Record<string, readonly string[]> = {
  healthcare: [
    "crm",
    "customer-portals",
    "document-management",
    "workflow-management",
    "analytics-dashboards",
    "scheduling",
    "document-processing",
    "ai-assistants",
  ],
  finance: [
    "crm",
    "billing",
    "payment-systems",
    "analytics-dashboards",
    "document-processing",
    "decision-support",
    "business-reports",
    "administrative-systems",
    "business-intelligence",
  ],
  retail: [
    "point-of-sale",
    "ecommerce",
    "inventory-management",
    "order-management",
    "crm",
    "analytics-dashboards",
    "marketplaces",
    "customer-management",
  ],
  ecommerce: [
    "ecommerce",
    "marketplaces",
    "inventory-management",
    "order-management",
    "payment-systems",
    "subscription-management",
    "analytics-dashboards",
    "product-catalogs",
  ],
  manufacturing: [
    "erp",
    "manufacturing-execution",
    "inventory-management",
    "production-planning",
    "maintenance-management",
    "procurement",
    "industrial-iot",
    "industrial-automation",
    "robotics",
    "vendor-management",
    "hardware-software-integration",
    "data-acquisition",
  ],
  logistics: [
    "fleet-management",
    "warehouse-management",
    "logistics-management",
    "scheduling",
    "analytics-dashboards",
    "telemetry-systems",
  ],
  construction: [
    "project-management",
    "procurement",
    "scheduling",
    "quotation-systems",
    "document-management",
    "employee-management",
  ],
  "real-estate": [
    "crm",
    "booking-reservations",
    "customer-portals",
    "analytics-dashboards",
    "document-management",
  ],
  hospitality: [
    "booking-reservations",
    "point-of-sale",
    "inventory-management",
    "customer-management",
    "analytics-dashboards",
  ],
  education: [
    "crm",
    "customer-portals",
    "scheduling",
    "analytics-dashboards",
    "document-management",
    "administrative-systems",
  ],
  agriculture: [
    "smart-agriculture",
    "telemetry-systems",
    "industrial-iot",
    "device-management",
    "analytics-dashboards",
    "sensor-networks",
  ],
  automotive: ["inventory-management", "scheduling", "crm", "fleet-management", "embedded-systems"],
  energy: [
    "monitoring-systems",
    "telemetry-systems",
    "analytics-dashboards",
    "industrial-iot",
    "energy-monitoring",
    "predictive-analytics",
  ],
  "professional-services": [
    "crm",
    "project-management",
    "billing",
    "scheduling",
    "document-management",
    "customer-portals",
  ],
  "technology-saas": [
    "crm",
    "subscription-management",
    "billing",
    "analytics-dashboards",
    "customer-portals",
    "ai-assistants",
    "rag-applications",
  ],
  telecommunications: [
    "customer-management",
    "billing",
    "monitoring-systems",
    "device-management",
    "analytics-dashboards",
    "sensor-networks",
  ],
  mining: [
    "maintenance-management",
    "telemetry-systems",
    "monitoring-systems",
    "analytics-dashboards",
    "industrial-iot",
    "control-systems",
  ],
  "food-production": [
    "production-planning",
    "inventory-management",
    "manufacturing-execution",
    "procurement",
    "workflow-management",
    "data-platforms",
  ],
  tourism: [
    "booking-reservations",
    "crm",
    "payment-systems",
    "customer-portals",
    "analytics-dashboards",
  ],
  custom: [],
};
