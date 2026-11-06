import { text, type EntitySchema, type FieldDef, type NavItem } from '@triunder/domain';
import type { ModuleDefinition } from './types';

function field(
  key: string,
  type: FieldDef['type'],
  en: string,
  es: string,
  extra: Partial<FieldDef> = {},
): FieldDef {
  return {
    key,
    type,
    label: text(en, es),
    table: true,
    form: true,
    sortable: true,
    ...extra,
  };
}

function entity(
  key: string,
  singular: [string, string],
  plural: [string, string],
  primary: string,
  fields: FieldDef[],
  search: string[],
): EntitySchema {
  return {
    key,
    singular: text(singular[0], singular[1]),
    plural: text(plural[0], plural[1]),
    primary,
    search,
    fields,
  };
}

const stockItem = entity(
  'stock_items',
  ['Stock item', 'Artículo de existencia'],
  ['Stock items', 'Artículos de existencia'],
  'name',
  [
    field('sku', 'text', 'SKU', 'SKU', { required: true }),
    field('name', 'text', 'Name', 'Nombre', { required: true }),
    field('onHand', 'number', 'On hand', 'Disponible', { required: true, min: 0 }),
    field('status', 'status', 'Status', 'Estado', {
      options: [
        { value: 'available', label: text('Available', 'Disponible') },
        { value: 'held', label: text('Held', 'Retenido') },
        { value: 'committed', label: text('Committed', 'Comprometido') },
      ],
    }),
  ],
  ['sku', 'name'],
);

const stockMove = entity(
  'stock_moves',
  ['Stock movement', 'Movimiento de existencia'],
  ['Stock movements', 'Movimientos de existencia'],
  'sku',
  [
    field('sku', 'text', 'SKU', 'SKU', { required: true, form: false }),
    field('quantity', 'number', 'Quantity', 'Cantidad', { form: false }),
    field('reason', 'text', 'Reason', 'Motivo', { form: false }),
  ],
  ['sku', 'reason'],
);

const maintenanceTask = entity(
  'maintenance_tasks',
  ['Maintenance task', 'Tarea de mantenimiento'],
  ['Maintenance tasks', 'Tareas de mantenimiento'],
  'title',
  [
    field('title', 'text', 'Title', 'Título', { required: true }),
    field('source', 'text', 'Source', 'Origen'),
    field('asset', 'text', 'Asset', 'Activo'),
    field('status', 'status', 'Status', 'Estado', {
      options: [
        { value: 'open', label: text('Open', 'Abierta') },
        { value: 'in_progress', label: text('In progress', 'En curso') },
        { value: 'done', label: text('Done', 'Hecha') },
      ],
    }),
  ],
  ['title', 'asset', 'source'],
);

/**
 * Optional slices. `embedded-diagnostics` depends on `iot-monitoring` because
 * a diagnostic snapshot without a telemetry path has nothing to explain.
 * Remove the dependency here only if the product decision changes, and update
 * the module tests with it.
 */
export const modules: readonly ModuleDefinition[] = [
  {
    id: 'inventory',
    name: text('Inventory', 'Inventario'),
    description: text(
      'A ledger of what is on hand. Orders and work orders post movements into it.',
      'Un libro de lo disponible. Los pedidos y las órdenes de trabajo registran movimientos aquí.',
    ),
    compatibleSolutions: ['ecommerce', 'orders', 'mes', 'order-management', 'production-planning', 'scheduling', 'pos', 'inventory'],
    compatibleIndustries: [],
    dependencies: [],
    conflicts: [],
    entities: [stockItem, stockMove],
    navigation: [
      {
        id: 'stock',
        label: text('Stock', 'Existencias'),
        icon: 'layers',
        view: 'entity',
        entityKey: 'stock_items',
        moduleId: 'inventory',
      },
    ],
    seed: {
      stock_items: [
        { id: 'stk-sheet', sku: 'STL-1', name: 'Harborline steel sheet', onHand: 40, status: 'available' },
        { id: 'stk-fastener', sku: 'FST-4', name: 'Harborline fastener kit', onHand: 120, status: 'available' },
        { id: 'stk-note', sku: 'NT-1', name: 'Field notebook', onHand: 30, status: 'available' },
        { id: 'stk-lamp', sku: 'LM-2', name: 'Desk lamp', onHand: 12, status: 'available' },
      ],
      stock_moves: [],
    },
    listens: ['commerce.order.placed', 'mes.work_order.released', 'lot.held', 'fulfillment.packed'],
    emits: ['inventory.adjusted'],
  },
  {
    id: 'maintenance',
    name: text('Maintenance', 'Mantenimiento'),
    description: text(
      'Tasks opened by people or by a threshold alert.',
      'Tareas abiertas por personas o por una alerta de umbral.',
    ),
    compatibleSolutions: [
      'mes',
      'fleet',
      'fleet-management',
      'iot',
      'smart-agriculture',
      'energy-monitoring',
      'telemetry',
      'monitoring',
      'industrial-iot',
      'cmms',
    ],
    compatibleIndustries: [],
    dependencies: [],
    conflicts: [],
    entities: [maintenanceTask],
    navigation: [
      {
        id: 'maintenance',
        label: text('Maintenance', 'Mantenimiento'),
        icon: 'factory',
        view: 'entity',
        entityKey: 'maintenance_tasks',
        moduleId: 'maintenance',
      },
    ],
    seed: {
      maintenance_tasks: [
        {
          id: 'mnt-seed',
          title: 'Inspect Harborline conveyor guard',
          source: 'plan',
          asset: 'Line A',
          status: 'open',
        },
      ],
    },
    listens: ['iot.threshold.breached'],
    emits: ['maintenance.task.opened'],
  },
  {
    id: 'analytics',
    name: text('Analytics', 'Analítica'),
    description: text(
      'A saved reading of the demonstration, separate from the operational screens.',
      'Una lectura guardada de la demostración, separada de las pantallas operativas.',
    ),
    compatibleSolutions: [
      'crm',
      'ecommerce',
      'mes',
      'fleet-management',
      'project-management',
      'booking',
      'analytics',
      'order-management',
      'scheduling',
      'energy-monitoring',
      'iot',
      'smart-agriculture',
      'fleet',
      'orders',
      'workflows',
      'workflow',
      'production-planning',
    ],
    compatibleIndustries: [],
    dependencies: [],
    conflicts: [],
    entities: [
      entity(
        'saved_views',
        ['Saved view', 'Vista guardada'],
        ['Saved views', 'Vistas guardadas'],
        'name',
        [
          field('name', 'text', 'Name', 'Nombre', { required: true }),
          field('focus', 'text', 'Focus', 'Foco', { required: true }),
        ],
        ['name', 'focus'],
      ),
    ],
    navigation: [
      {
        id: 'analytics',
        label: text('Analytics', 'Analítica'),
        icon: 'chart',
        view: 'custom',
        custom: 'analytics-board',
        moduleId: 'analytics',
        minComplexity: 'professional',
      },
    ],
    seed: {
      saved_views: [
        { id: 'view-ops', name: 'This week', focus: 'Open work' },
      ],
    },
    listens: [],
    emits: [],
  },
  {
    id: 'iot-monitoring',
    name: text('IoT monitoring', 'Monitoreo IoT'),
    description: text(
      'A log of simulated readings. Nothing in this module is a live device.',
      'Un registro de lecturas simuladas. Nada en este módulo es un dispositivo real.',
    ),
    compatibleSolutions: [
      'mes',
      'iot',
      'smart-agriculture',
      'energy-monitoring',
      'telemetry',
      'monitoring',
      'industrial-iot',
      'sensor-networks',
      'data-acquisition',
    ],
    compatibleIndustries: [],
    dependencies: [],
    conflicts: [],
    entities: [
      entity(
        'telemetry_points',
        ['Telemetry point', 'Punto de telemetría'],
        ['Telemetry', 'Telemetría'],
        'metric',
        [
          field('metric', 'text', 'Metric', 'Métrica', { form: false }),
          field('value', 'number', 'Value', 'Valor', { form: false }),
          field('source', 'text', 'Source', 'Origen', { form: false }),
        ],
        ['metric', 'source'],
      ),
    ],
    navigation: [
      {
        id: 'telemetry',
        label: text('Telemetry', 'Telemetría'),
        icon: 'signal',
        view: 'entity',
        entityKey: 'telemetry_points',
        moduleId: 'iot-monitoring',
      },
    ],
    seed: {
      telemetry_points: [
        { id: 'tel-1', metric: 'signal', value: 92, source: 'Harborline gateway' },
      ],
    },
    listens: [],
    emits: ['iot.threshold.breached'],
  },
  {
    id: 'payments',
    name: text('Payments', 'Pagos'),
    description: text(
      'A simulated payment record. The showroom never charges a real instrument.',
      'Un registro de pago simulado. La sala nunca carga un instrumento real.',
    ),
    compatibleSolutions: ['ecommerce', 'booking', 'pos', 'payments', 'billing', 'subscriptions'],
    compatibleIndustries: [],
    dependencies: [],
    conflicts: [],
    entities: [
      entity(
        'payment_records',
        ['Payment record', 'Registro de pago'],
        ['Payment records', 'Registros de pago'],
        'reference',
        [
          field('reference', 'text', 'Reference', 'Referencia', { form: false }),
          field('amountCents', 'currency', 'Amount', 'Importe', { form: false }),
          field('state', 'status', 'State', 'Estado', {
            form: false,
            options: [
              { value: 'simulated', label: text('Simulated', 'Simulado') },
              { value: 'void', label: text('Void', 'Anulado') },
            ],
          }),
        ],
        ['reference'],
      ),
    ],
    navigation: [
      {
        id: 'payments',
        label: text('Payments', 'Pagos'),
        icon: 'card',
        view: 'entity',
        entityKey: 'payment_records',
        moduleId: 'payments',
      },
    ],
    seed: { payment_records: [] },
    listens: ['commerce.order.placed', 'booking.confirmed'],
    emits: [],
  },
  {
    id: 'approvals',
    name: text('Approvals', 'Aprobaciones'),
    description: text(
      'A queue for actions that should wait for another simulated role.',
      'Una cola para acciones que deben esperar a otro rol simulado.',
    ),
    compatibleSolutions: ['mes', 'crm', 'project-management', 'workflow', 'workflows', 'procurement', 'quotation', 'billing'],
    compatibleIndustries: [],
    dependencies: [],
    conflicts: [],
    entities: [
      entity(
        'approvals',
        ['Approval', 'Aprobación'],
        ['Approvals', 'Aprobaciones'],
        'title',
        [
          field('title', 'text', 'Title', 'Título', { form: false }),
          field('status', 'status', 'Status', 'Estado', {
            options: [
              { value: 'pending', label: text('Pending', 'Pendiente') },
              { value: 'approved', label: text('Approved', 'Aprobada') },
              { value: 'rejected', label: text('Rejected', 'Rechazada') },
            ],
          }),
        ],
        ['title'],
      ),
    ],
    navigation: [
      {
        id: 'approvals',
        label: text('Approvals', 'Aprobaciones'),
        icon: 'scale',
        view: 'entity',
        entityKey: 'approvals',
        moduleId: 'approvals',
        minComplexity: 'enterprise',
      },
    ],
    seed: { approvals: [] },
    listens: [],
    emits: [],
  },
  {
    id: 'robotics-cell',
    name: text('Robot cell', 'Celda robótica'),
    description: text(
      'A simulated two-axis cell with an emergency stop. No controller is attached.',
      'Una celda simulada de dos ejes con parada de emergencia. No hay un controlador conectado.',
    ),
    compatibleSolutions: ['mes', 'robotics', 'industrial-automation', 'control-systems'],
    compatibleIndustries: [],
    dependencies: [],
    conflicts: [],
    entities: [
      entity(
        'robots',
        ['Robot', 'Robot'],
        ['Robots', 'Robots'],
        'name',
        [
          field('name', 'text', 'Name', 'Nombre', { required: true }),
          field('x', 'number', 'X', 'X', { min: 0, max: 100 }),
          field('y', 'number', 'Y', 'Y', { min: 0, max: 100 }),
          field('state', 'status', 'State', 'Estado', {
            options: [
              { value: 'idle', label: text('Idle', 'En reposo') },
              { value: 'moving', label: text('Moving', 'En movimiento') },
              { value: 'estop', label: text('Emergency stop', 'Parada de emergencia') },
            ],
          }),
          field('firmware', 'text', 'Firmware', 'Firmware'),
        ],
        ['name', 'firmware'],
      ),
    ],
    navigation: [
      {
        id: 'robots',
        label: text('Robot cell', 'Celda robótica'),
        icon: 'factory',
        view: 'custom',
        custom: 'robotics-cell',
        moduleId: 'robotics-cell',
      },
    ],
    seed: {
      robots: [
        {
          id: 'robot-1',
          name: 'Harborline cell A',
          x: 20,
          y: 20,
          state: 'idle',
          firmware: 'sim-1.4.0',
        },
      ],
    },
    listens: [],
    emits: ['robot.state'],
  },
  {
    id: 'embedded-diagnostics',
    name: text('Embedded diagnostics', 'Diagnóstico embebido'),
    description: text(
      'Firmware identity and a simulated diagnostic snapshot.',
      'Identidad de firmware y una instantánea de diagnóstico simulada.',
    ),
    compatibleSolutions: ['iot', 'smart-agriculture', 'telemetry', 'embedded', 'device-management', 'hardware-integration'],
    compatibleIndustries: [],
    dependencies: ['iot-monitoring'],
    conflicts: [],
    entities: [
      entity(
        'diagnostics',
        ['Diagnostic', 'Diagnóstico'],
        ['Diagnostics', 'Diagnósticos'],
        'device',
        [
          field('device', 'text', 'Device', 'Dispositivo', { required: true }),
          field('firmware', 'text', 'Firmware', 'Firmware', { required: true }),
          field('health', 'status', 'Health', 'Salud', {
            options: [
              { value: 'ok', label: text('OK', 'Correcto') },
              { value: 'degraded', label: text('Degraded', 'Degradado') },
            ],
          }),
          field('note', 'textarea', 'Note', 'Nota'),
        ],
        ['device', 'firmware', 'note'],
      ),
    ],
    navigation: [
      {
        id: 'diagnostics',
        label: text('Diagnostics', 'Diagnóstico'),
        icon: 'chip',
        view: 'custom',
        custom: 'embedded-diagnostics',
        moduleId: 'embedded-diagnostics',
      },
    ],
    seed: {
      diagnostics: [
        {
          id: 'diag-1',
          device: 'Harborline node',
          firmware: 'sim-fw-0.9.2',
          health: 'ok',
          note: 'Simulated boot. No physical board is connected.',
        },
      ],
    },
    listens: [],
    emits: [],
  },
  {
    id: 'customer-portal',
    name: text('Customer portal', 'Portal del cliente'),
    description: text(
      'Messages a customer could see. Delivery is simulated.',
      'Mensajes que un cliente podría ver. La entrega es simulada.',
    ),
    compatibleSolutions: ['crm', 'ecommerce', 'customer-portal', 'customer-management', 'analytics'],
    compatibleIndustries: [],
    dependencies: [],
    conflicts: [],
    entities: [
      entity(
        'portal_messages',
        ['Portal message', 'Mensaje del portal'],
        ['Portal messages', 'Mensajes del portal'],
        'subject',
        [
          field('subject', 'text', 'Subject', 'Asunto', { required: true }),
          field('body', 'textarea', 'Message', 'Mensaje', { required: true }),
          field('audience', 'text', 'Audience', 'Audiencia'),
        ],
        ['subject', 'body'],
      ),
    ],
    navigation: [
      {
        id: 'portal',
        label: text('Portal', 'Portal'),
        icon: 'card',
        view: 'entity',
        entityKey: 'portal_messages',
        moduleId: 'customer-portal',
      },
    ],
    seed: {
      portal_messages: [
        {
          id: 'msg-1',
          subject: 'Your Harborline visit',
          body: 'This message exists only inside the demonstration.',
          audience: 'customer',
        },
      ],
    },
    listens: [],
    emits: [],
  },
];
