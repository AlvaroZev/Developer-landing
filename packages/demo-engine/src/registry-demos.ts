import { text, type LocaleText } from '@triunder/domain';
import { entity, field, nav, statusField } from './fields';
import type { DemoDefinition, DemoEngineName, TelemetryHint } from './types';

/**
 * Registry-backed demonstrations. They share the generic, booking, or
 * telemetry engine, but each one has its own entities and seed. Do not
 * satisfy a new industry by cloning labels onto an existing demo.
 */
interface Spec {
  id: string;
  industry: string;
  solution: string;
  engine?: DemoEngineName;
  summary: LocaleText;
  modules: string[];
  primary: {
    key: string;
    singular: [string, string];
    plural: [string, string];
    title: string;
    statuses?: readonly (readonly [string, string, string])[];
    extra?: ReturnType<typeof field>[];
    rows: Record<string, unknown>[];
  };
  secondary?: Spec['primary'];
  capacity?: boolean;
  telemetry?: TelemetryHint;
  workflow: LocaleText;
}

function titleField(key: string) {
  const labels: Record<string, [string, string]> = {
    name: ['Name', 'Nombre'],
    reference: ['Reference', 'Referencia'],
    number: ['Number', 'Número'],
    code: ['Code', 'Código'],
    title: ['Title', 'Título'],
    question: ['Question', 'Pregunta'],
    household: ['Household', 'Hogar'],
  };
  const label = labels[key] ?? [key, key];
  return field(key, 'text', label[0], label[1], { required: true });
}

function fromSpec(spec: Spec): DemoDefinition {
  const statuses = spec.primary.statuses;
  const primaryFields = [
    titleField(spec.primary.title),
    ...(spec.primary.extra ?? []),
    ...(statuses ? [statusField(statuses)] : []),
  ];
  const entities = [
    entity(
      spec.primary.key,
      spec.primary.singular,
      spec.primary.plural,
      spec.primary.title,
      primaryFields,
      [spec.primary.title],
      statuses ? 'status' : undefined,
    ),
  ];
  const seed: Record<string, Record<string, unknown>[]> = {
    [spec.primary.key]: spec.primary.rows,
  };
  const navigation = [
    nav('dashboard', 'Board', 'Tablero', 'layers', 'dashboard'),
    nav(
      spec.primary.key,
      spec.primary.plural[0],
      spec.primary.plural[1],
      'layers',
      statuses ? 'board' : 'entity',
      { entityKey: spec.primary.key },
    ),
  ];
  if (spec.secondary) {
    const secondaryStatuses = spec.secondary.statuses;
    entities.push(
      entity(
        spec.secondary.key,
        spec.secondary.singular,
        spec.secondary.plural,
        spec.secondary.title,
        [
          titleField(spec.secondary.title),
          ...(spec.secondary.extra ?? []),
          ...(secondaryStatuses ? [statusField(secondaryStatuses)] : []),
        ],
        [spec.secondary.title],
        secondaryStatuses ? 'status' : undefined,
      ),
    );
    seed[spec.secondary.key] = spec.secondary.rows;
    navigation.push(
      nav(spec.secondary.key, spec.secondary.plural[0], spec.secondary.plural[1], 'briefcase', 'entity', {
        entityKey: spec.secondary.key,
      }),
    );
  }
  return {
    id: spec.id,
    industry: spec.industry,
    solution: spec.solution,
    engine: spec.engine ?? 'generic',
    summary: spec.summary,
    navigation,
    entities,
    metrics: [
      {
        id: 'count',
        label: text(spec.primary.plural[0], spec.primary.plural[1]),
        kind: 'count',
        entity: spec.primary.key,
      },
      ...(statuses
        ? [
            {
              id: 'attention',
              label: text('Needs attention', 'Requieren atención'),
              kind: 'countWhere' as const,
              entity: spec.primary.key,
              field: 'status',
              equals: statuses[0]?.[0] ?? 'open',
              minComplexity: 'professional' as const,
            },
          ]
        : []),
    ],
    charts: [
      {
        id: 'week',
        label: text('Demonstration week', 'Semana de demostración'),
        minComplexity: 'professional',
        points: [
          { label: text('Mon', 'Lun'), value: 3 },
          { label: text('Tue', 'Mar'), value: 5 },
          { label: text('Wed', 'Mié'), value: 4 },
          { label: text('Thu', 'Jue'), value: 6 },
        ],
      },
    ],
    seed,
    workflows: [spec.workflow],
    optionalModules: spec.modules,
    capacity: spec.capacity ? { entity: spec.primary.key } : undefined,
    telemetry: spec.telemetry,
  };
}

const open: readonly (readonly [string, string, string])[] = [
  ['open', 'Open', 'Abierto'],
  ['active', 'Active', 'Activo'],
  ['closed', 'Closed', 'Cerrado'],
];

export const registryDemos: readonly DemoDefinition[] = [
  fromSpec({
    id: 'finance-crm',
    industry: 'finance',
    solution: 'crm',
    summary: text('Advisor desk for Harborline households and reviews.', 'Mesa de asesoría para hogares y revisiones de Harborline.'),
    modules: ['analytics', 'approvals'],
    workflow: text('Schedule a household review.', 'Programar una revisión de hogar.'),
    primary: {
      key: 'households',
      singular: ['Household', 'Hogar'],
      plural: ['Households', 'Hogares'],
      title: 'name',
      statuses: [
        ['review_due', 'Review due', 'Revisión pendiente'],
        ['scheduled', 'Scheduled', 'Programada'],
        ['current', 'Current', 'Al día'],
      ],
      extra: [field('advisor', 'text', 'Advisor', 'Asesor'), field('focus', 'text', 'Focus', 'Foco')],
      rows: [
        { id: 'hh-1', name: 'Pell & Calder', advisor: 'Noor Hale', focus: 'Education fund', status: 'review_due' },
        { id: 'hh-2', name: 'Marsh household', advisor: 'Noor Hale', focus: 'Cash reserve', status: 'current' },
        { id: 'hh-3', name: 'Adey household', advisor: 'Ivo Lang', focus: 'Property sale', status: 'scheduled' },
      ],
    },
    secondary: {
      key: 'reviews',
      singular: ['Review', 'Revisión'],
      plural: ['Reviews', 'Revisiones'],
      title: 'household',
      extra: [field('when', 'date', 'When', 'Cuándo')],
      rows: [{ id: 'rv-1', household: 'Adey household', when: '2026-04-18' }],
    },
  }),
  fromSpec({
    id: 'ecommerce-orders',
    industry: 'ecommerce',
    solution: 'orders',
    summary: text('Fulfillment desk for Harborline web orders.', 'Mesa de preparación de pedidos web de Harborline.'),
    modules: ['inventory', 'analytics'],
    workflow: text('Pack an order and record the exception.', 'Preparar un pedido y registrar la excepción.'),
    primary: {
      key: 'orders',
      singular: ['Order', 'Pedido'],
      plural: ['Orders', 'Pedidos'],
      title: 'reference',
      statuses: [
        ['new', 'New', 'Nuevo'],
        ['packed', 'Packed', 'Preparado'],
        ['shipped', 'Shipped', 'Enviado'],
        ['exception', 'Exception', 'Excepción'],
      ],
      extra: [
        field('customer', 'text', 'Customer', 'Cliente'),
        field('sku', 'text', 'SKU', 'SKU'),
        field('quantity', 'number', 'Quantity', 'Cantidad', { min: 1 }),
      ],
      rows: [
        { id: 'eo-1', reference: 'WEB-220', customer: 'Nia Pell', sku: 'NT-1', quantity: 2, status: 'new' },
        { id: 'eo-2', reference: 'WEB-221', customer: 'Edwin Cho', sku: 'LM-2', quantity: 1, status: 'exception' },
      ],
    },
  }),
  fromSpec({
    id: 'construction-projects',
    industry: 'construction',
    solution: 'project-management',
    summary: text('Site packages and field questions for Harborline Yard.', 'Paquetes de obra y preguntas de campo de Harborline Yard.'),
    modules: ['analytics', 'approvals'],
    workflow: text('Answer an RFI and update the package.', 'Responder una solicitud y actualizar el paquete.'),
    primary: {
      key: 'packages',
      singular: ['Work package', 'Paquete de trabajo'],
      plural: ['Work packages', 'Paquetes de trabajo'],
      title: 'name',
      statuses: open,
      extra: [field('site', 'text', 'Site', 'Obra')],
      rows: [
        { id: 'pk-1', name: 'Wharf drainage', site: 'Wharf', status: 'open' },
        { id: 'pk-2', name: 'Kiln stair', site: 'Old kiln', status: 'active' },
      ],
    },
    secondary: {
      key: 'rfis',
      singular: ['RFI', 'Solicitud de información'],
      plural: ['RFIs', 'Solicitudes'],
      title: 'question',
      statuses: [
        ['open', 'Open', 'Abierta'],
        ['answered', 'Answered', 'Respondida'],
      ],
      rows: [{ id: 'rfi-1', question: 'Drain invert at grid C', status: 'open' }],
    },
  }),
  fromSpec({
    id: 'hospitality-booking',
    industry: 'hospitality',
    solution: 'booking',
    engine: 'booking',
    capacity: true,
    summary: text('Dining-room seatings for Harborline Table.', 'Reservas del comedor de Harborline Table.'),
    modules: ['payments', 'analytics'],
    workflow: text('Confirm a seating while covers remain.', 'Confirmar una reserva mientras queden cubiertos.'),
    primary: {
      key: 'services',
      singular: ['Service', 'Servicio'],
      plural: ['Services', 'Servicios'],
      title: 'name',
      statuses: [
        ['open', 'Open', 'Abierto'],
        ['confirmed', 'Confirmed', 'Confirmado'],
        ['full', 'Full', 'Completo'],
      ],
      extra: [
        field('remaining', 'number', 'Covers left', 'Cubiertos restantes', { min: 0 }),
        field('depositCents', 'currency', 'Simulated deposit', 'Depósito simulado', { min: 0 }),
      ],
      rows: [
        { id: 'svc-1', name: 'Friday supper', remaining: 4, depositCents: 2500, status: 'open' },
        { id: 'svc-2', name: 'Sunday lunch', remaining: 0, depositCents: 0, status: 'full' },
      ],
    },
  }),
  fromSpec({
    id: 'education-crm',
    industry: 'education',
    solution: 'crm',
    summary: text('Admissions for the Harborline studio school.', 'Admisiones de la escuela-taller Harborline.'),
    modules: ['analytics', 'approvals'],
    workflow: text('Advance an applicant after interview.', 'Avanzar a un postulante después de la entrevista.'),
    primary: {
      key: 'applicants',
      singular: ['Applicant', 'Postulante'],
      plural: ['Applicants', 'Postulantes'],
      title: 'name',
      statuses: [
        ['applied', 'Applied', 'Postuló'],
        ['interview', 'Interview', 'Entrevista'],
        ['offer', 'Offer', 'Oferta'],
        ['declined', 'Declined', 'Rechazada'],
      ],
      extra: [field('cohort', 'text', 'Cohort', 'Cohorte'), field('mentor', 'text', 'Mentor', 'Mentor')],
      rows: [
        { id: 'ap-1', name: 'Lina Ortega', cohort: 'Autumn studio', mentor: 'Wes Adler', status: 'interview' },
        { id: 'ap-2', name: 'Chris Bell', cohort: 'Autumn studio', mentor: 'Wes Adler', status: 'applied' },
      ],
    },
  }),
  fromSpec({
    id: 'automotive-service',
    industry: 'automotive',
    solution: 'scheduling',
    summary: text('Workshop bays and repair orders at Harborline Motor.', 'Bahías y órdenes de reparación en Harborline Motor.'),
    modules: ['inventory', 'analytics'],
    workflow: text('Move a repair order onto a bay.', 'Pasar una orden de reparación a una bahía.'),
    primary: {
      key: 'repairs',
      singular: ['Repair order', 'Orden de reparación'],
      plural: ['Repair orders', 'Órdenes de reparación'],
      title: 'number',
      statuses: [
        ['waiting_parts', 'Waiting on parts', 'Espera piezas'],
        ['in_bay', 'In bay', 'En bahía'],
        ['ready', 'Ready', 'Lista'],
      ],
      extra: [field('bay', 'text', 'Bay', 'Bahía'), field('partSku', 'text', 'Part SKU', 'SKU de pieza')],
      rows: [
        { id: 'rp-1', number: 'RO-88', bay: 'Bay 2', partSku: 'FST-4', status: 'waiting_parts' },
        { id: 'rp-2', number: 'RO-89', bay: 'Bay 1', partSku: 'LM-2', status: 'in_bay' },
      ],
    },
  }),
  fromSpec({
    id: 'energy-monitoring',
    industry: 'energy',
    solution: 'energy-monitoring',
    engine: 'telemetry',
    telemetry: {
      entity: 'meters',
      valueField: 'demandKw',
      thresholdField: 'thresholdKw',
      direction: 'above',
      metric: 'kW',
    },
    summary: text('Feeder meters for the Harborline yard, simulated.', 'Medidores de alimentador del patio Harborline, simulados.'),
    modules: ['iot-monitoring', 'maintenance', 'analytics'],
    workflow: text('Take a reading that crosses the demand threshold.', 'Tomar una lectura que cruza el umbral de demanda.'),
    primary: {
      key: 'meters',
      singular: ['Meter', 'Medidor'],
      plural: ['Meters', 'Medidores'],
      title: 'name',
      statuses: [
        ['normal', 'Normal', 'Normal'],
        ['alarm', 'Alarm', 'Alarma'],
        ['offline', 'Offline', 'Fuera de línea'],
      ],
      extra: [
        field('feeder', 'text', 'Feeder', 'Alimentador'),
        field('demandKw', 'number', 'Demand kW', 'Demanda kW'),
        field('thresholdKw', 'number', 'Threshold kW', 'Umbral kW'),
      ],
      rows: [
        { id: 'mt-1', name: 'Feeder North', feeder: 'North', demandKw: 70, thresholdKw: 80, status: 'normal' },
        { id: 'mt-2', name: 'Feeder Kiln', feeder: 'Kiln', demandKw: 40, thresholdKw: 90, status: 'normal' },
      ],
    },
  }),
  fromSpec({
    id: 'services-engagements',
    industry: 'professional-services',
    solution: 'project-management',
    summary: text('Engagements and open questions for a Harborline studio.', 'Encargos y preguntas abiertas de un estudio Harborline.'),
    modules: ['analytics', 'approvals'],
    workflow: text('Log time against an engagement.', 'Registrar tiempo contra un encargo.'),
    primary: {
      key: 'engagements',
      singular: ['Engagement', 'Encargo'],
      plural: ['Engagements', 'Encargos'],
      title: 'name',
      statuses: open,
      extra: [field('principal', 'text', 'Principal', 'Responsable'), field('hours', 'number', 'Hours', 'Horas', { min: 0 })],
      rows: [
        { id: 'eng-1', name: 'Wharf drainage advice', principal: 'Alvaro Zevallos', hours: 12, status: 'open' },
        { id: 'eng-2', name: 'Kiln stair review', principal: 'Alvaro Zevallos', hours: 6, status: 'active' },
      ],
    },
  }),
  fromSpec({
    id: 'technology-analytics',
    industry: 'technology',
    solution: 'analytics',
    summary: text('Account usage and incidents for a fictional Harborline product.', 'Uso de cuentas e incidentes de un producto ficticio de Harborline.'),
    modules: ['analytics', 'customer-portal'],
    workflow: text('Open an incident from a usage drop.', 'Abrir un incidente a partir de una caída de uso.'),
    primary: {
      key: 'accounts',
      singular: ['Account', 'Cuenta'],
      plural: ['Accounts', 'Cuentas'],
      title: 'name',
      statuses: [
        ['healthy', 'Healthy', 'Sana'],
        ['dropping', 'Usage dropping', 'Uso en caída'],
        ['paused', 'Paused', 'En pausa'],
      ],
      extra: [field('weeklyUsers', 'number', 'Weekly users', 'Usuarios semanales', { min: 0 })],
      rows: [
        { id: 'ac-1', name: 'Northwind Desk', weeklyUsers: 40, status: 'dropping' },
        { id: 'ac-2', name: 'Kiln Studio', weeklyUsers: 12, status: 'healthy' },
      ],
    },
    secondary: {
      key: 'incidents',
      singular: ['Incident', 'Incidente'],
      plural: ['Incidents', 'Incidentes'],
      title: 'title',
      statuses: [
        ['open', 'Open', 'Abierto'],
        ['closed', 'Closed', 'Cerrado'],
      ],
      rows: [{ id: 'inc-1', title: 'Northwind weekly users fell', status: 'open' }],
    },
  }),
  fromSpec({
    id: 'telecom-monitoring',
    industry: 'telecommunications',
    solution: 'monitoring',
    engine: 'telemetry',
    telemetry: {
      entity: 'nodes',
      valueField: 'lossPct',
      thresholdField: 'thresholdPct',
      direction: 'above',
      metric: '%',
    },
    summary: text('A network desk with simulated loss on Harborline links.', 'Una mesa de red con pérdida simulada en enlaces Harborline.'),
    modules: ['iot-monitoring', 'maintenance'],
    workflow: text('Sample a node and open the degradation.', 'Muestrear un nodo y abrir la degradación.'),
    primary: {
      key: 'nodes',
      singular: ['Node', 'Nodo'],
      plural: ['Nodes', 'Nodos'],
      title: 'name',
      statuses: [
        ['healthy', 'Healthy', 'Sano'],
        ['alarm', 'Alarm', 'Alarma'],
        ['offline', 'Offline', 'Fuera de línea'],
      ],
      extra: [
        field('link', 'text', 'Link', 'Enlace'),
        field('lossPct', 'number', 'Packet loss %', 'Pérdida de paquetes %'),
        field('thresholdPct', 'number', 'Threshold %', 'Umbral %'),
      ],
      rows: [
        { id: 'nd-1', name: 'Wharf edge', link: 'Wharf–Kiln', lossPct: 2, thresholdPct: 8, status: 'healthy' },
        { id: 'nd-2', name: 'Yard core', link: 'Yard', lossPct: 1, thresholdPct: 8, status: 'healthy' },
      ],
    },
  }),
  fromSpec({
    id: 'mining-telemetry',
    industry: 'mining',
    solution: 'telemetry',
    engine: 'telemetry',
    telemetry: {
      entity: 'assets',
      valueField: 'vibration',
      thresholdField: 'threshold',
      direction: 'above',
      metric: 'mm/s',
    },
    summary: text('Simulated pit telemetry for Harborline haul assets.', 'Telemetría simulada de tajo para activos de acarreo Harborline.'),
    modules: ['iot-monitoring', 'maintenance', 'embedded-diagnostics'],
    workflow: text('Raise a vibration reading above the threshold.', 'Elevar una lectura de vibración por encima del umbral.'),
    primary: {
      key: 'assets',
      singular: ['Asset', 'Activo'],
      plural: ['Assets', 'Activos'],
      title: 'name',
      statuses: [
        ['assigned', 'Assigned', 'Asignado'],
        ['alarm', 'Alarm', 'Alarma'],
        ['down', 'Down', 'Detenido'],
      ],
      extra: [
        field('shift', 'text', 'Shift', 'Turno'),
        field('vibration', 'number', 'Vibration', 'Vibración'),
        field('threshold', 'number', 'Threshold', 'Umbral'),
      ],
      rows: [
        { id: 'as-1', name: 'Haul truck 3', shift: 'Day', vibration: 4, threshold: 12, status: 'assigned' },
        { id: 'as-2', name: 'Shovel 1', shift: 'Day', vibration: 6, threshold: 20, status: 'assigned' },
      ],
    },
  }),
  fromSpec({
    id: 'food-production',
    industry: 'food-production',
    solution: 'production-planning',
    summary: text('Batch lots and quality holds at Harborline Kitchens.', 'Lotes y retenciones de calidad en Harborline Kitchens.'),
    modules: ['inventory', 'analytics'],
    workflow: text('Place a lot on hold.', 'Poner un lote en retención.'),
    primary: {
      key: 'lots',
      singular: ['Lot', 'Lote'],
      plural: ['Lots', 'Lotes'],
      title: 'code',
      statuses: [
        ['released', 'Released', 'Liberado'],
        ['hold', 'Hold', 'Retenido'],
        ['closed', 'Closed', 'Cerrado'],
      ],
      extra: [
        field('line', 'text', 'Line', 'Línea'),
        field('sku', 'text', 'SKU', 'SKU'),
        field('quantity', 'number', 'Quantity', 'Cantidad', { min: 0 }),
      ],
      rows: [
        { id: 'lot-18', code: 'LOT-18', line: 'Sauce', sku: 'LOT-18', quantity: 40, status: 'released' },
        { id: 'lot-19', code: 'LOT-19', line: 'Sauce', sku: 'LOT-19', quantity: 20, status: 'released' },
      ],
    },
  }),
  fromSpec({
    id: 'tourism-booking',
    industry: 'tourism',
    solution: 'booking',
    engine: 'booking',
    capacity: true,
    summary: text('Departures and remaining seats for Harborline Routes.', 'Salidas y plazas restantes de Harborline Routes.'),
    modules: ['payments', 'analytics'],
    workflow: text('Confirm a seat on a departure that still has room.', 'Confirmar una plaza en una salida que todavía tiene cupo.'),
    primary: {
      key: 'departures',
      singular: ['Departure', 'Salida'],
      plural: ['Departures', 'Salidas'],
      title: 'name',
      statuses: [
        ['open', 'Open', 'Abierta'],
        ['confirmed', 'Confirmed', 'Confirmada'],
        ['full', 'Full', 'Completa'],
      ],
      extra: [
        field('route', 'text', 'Route', 'Ruta'),
        field('remaining', 'number', 'Seats left', 'Plazas restantes', { min: 0 }),
        field('depositCents', 'currency', 'Simulated deposit', 'Depósito simulado', { min: 0 }),
      ],
      rows: [
        { id: 'dep-1', name: 'Saturday wharf walk', route: 'Wharf loop', remaining: 2, depositCents: 0, status: 'open' },
        { id: 'dep-2', name: 'Kiln evening', route: 'Kiln', remaining: 0, depositCents: 0, status: 'full' },
      ],
    },
  }),
  fromSpec({
    id: 'custom-workflow',
    industry: 'other',
    solution: 'workflows',
    summary: text('A neutral case desk for work that does not match another industry.', 'Una mesa neutra de casos para trabajo que no encaja en otra industria.'),
    modules: ['analytics', 'approvals'],
    workflow: text('Advance a case to the next step.', 'Avanzar un caso al siguiente paso.'),
    primary: {
      key: 'cases',
      singular: ['Case', 'Caso'],
      plural: ['Cases', 'Casos'],
      title: 'title',
      statuses: [
        ['intake', 'Intake', 'Ingreso'],
        ['doing', 'Doing', 'En curso'],
        ['done', 'Done', 'Hecho'],
      ],
      extra: [field('owner', 'text', 'Owner', 'Responsable')],
      rows: [
        { id: 'case-1', title: 'Describe the Tuesday workflow', owner: 'Unassigned', status: 'intake' },
        { id: 'case-2', title: 'Name the system this replaces', owner: 'Studio', status: 'doing' },
      ],
    },
  }),
];
