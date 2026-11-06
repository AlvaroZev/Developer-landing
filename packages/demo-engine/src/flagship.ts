import { text } from '@triunder/domain';
import { entity, field, nav, statusField } from './fields';
import type { DemoDefinition } from './types';

/**
 * The six flagship demonstrations. Their reducers live in ./reduce.ts under
 * the matching `engine` name. Seeds are the fictional Harborline dataset —
 * do not replace them with real patient, customer, or operational records.
 */
const appointmentStatus = statusField([
  ['requested', 'Requested', 'Solicitada'],
  ['confirmed', 'Confirmed', 'Confirmada'],
  ['completed', 'Completed', 'Completada'],
  ['cancelled', 'Cancelled', 'Cancelada'],
]);

const orderStatus = statusField([
  ['placed', 'Placed', 'Registrado'],
  ['packing', 'Packing', 'En preparación'],
  ['complete', 'Complete', 'Completo'],
]);

const workStatus = statusField([
  ['draft', 'Draft', 'Borrador'],
  ['awaiting_release', 'Awaiting release', 'Espera liberación'],
  ['released', 'Released', 'Liberada'],
  ['in_progress', 'In progress', 'En curso'],
  ['blocked', 'Blocked', 'Bloqueada'],
  ['completed', 'Completed', 'Completada'],
]);

const shipmentStatus = statusField([
  ['pending', 'Pending', 'Pendiente'],
  ['assigned', 'Assigned', 'Asignado'],
  ['in_transit', 'In transit', 'En tránsito'],
  ['delivered', 'Delivered', 'Entregado'],
  ['exception', 'Exception', 'Excepción'],
]);

const dealStatus = statusField([
  ['new', 'New', 'Nuevo'],
  ['qualified', 'Qualified', 'Calificado'],
  ['viewing', 'Viewing', 'En visita'],
  ['offer', 'Offer', 'Oferta'],
  ['won', 'Won', 'Ganada'],
  ['lost', 'Lost', 'Perdida'],
]);

export const flagshipDemos: readonly DemoDefinition[] = [
  {
    id: 'healthcare-crm',
    industry: 'healthcare',
    solution: 'crm',
    engine: 'healthcare',
    summary: text(
      'Harborline Clinic: patients, clinicians, appointments, and follow-ups.',
      'Clínica Harborline: pacientes, clínicos, citas y seguimientos.',
    ),
    optionalModules: ['analytics', 'customer-portal'],
    workflows: [
      text('Create and update an appointment.', 'Crear y actualizar una cita.'),
      text('Search patients and add a follow-up.', 'Buscar pacientes y añadir un seguimiento.'),
    ],
    roles: [
      { id: 'coordinator', label: text('Coordinator', 'Coordinación'), allow: ['*'] },
      {
        id: 'clinician',
        label: text('Clinician', 'Clínico'),
        allow: ['appointment.update', 'followup.add', 'record.update'],
      },
      {
        id: 'front-desk',
        label: text('Front desk', 'Recepción'),
        allow: ['appointment.create', 'record.create', 'record.update'],
      },
    ],
    navigation: [
      nav('dashboard', 'Board', 'Tablero', 'pulse', 'dashboard'),
      nav('patients', 'Patients', 'Pacientes', 'pulse', 'entity', { entityKey: 'patients' }),
      nav('appointments', 'Appointments', 'Citas', 'book', 'entity', { entityKey: 'appointments' }),
      nav('clinicians', 'Clinicians', 'Clínicos', 'briefcase', 'entity', { entityKey: 'professionals' }),
      nav('followups', 'Follow-ups', 'Seguimientos', 'layers', 'entity', { entityKey: 'followups' }),
    ],
    entities: [
      entity('patients', ['Patient', 'Paciente'], ['Patients', 'Pacientes'], 'name', [
        field('name', 'text', 'Name', 'Nombre', { required: true }),
        field('mrn', 'text', 'Record number', 'Número de ficha', { required: true }),
        field('status', 'status', 'Status', 'Estado', {
          filterable: true,
          options: [
            { value: 'active', label: text('Active', 'Activo') },
            { value: 'inactive', label: text('Inactive', 'Inactivo') },
          ],
        }),
      ], ['name', 'mrn'], 'status'),
      entity('professionals', ['Clinician', 'Clínico'], ['Clinicians', 'Clínicos'], 'name', [
        field('name', 'text', 'Name', 'Nombre', { required: true }),
        field('role', 'text', 'Role', 'Rol', { required: true }),
      ], ['name', 'role']),
      entity('appointments', ['Appointment', 'Cita'], ['Appointments', 'Citas'], 'reason', [
        field('patientId', 'text', 'Patient', 'Paciente', { required: true }),
        field('professionalId', 'text', 'Clinician', 'Clínico', { required: true }),
        field('start', 'date', 'When', 'Cuándo', { required: true }),
        field('reason', 'text', 'Reason', 'Motivo', { required: true }),
        appointmentStatus,
      ], ['reason', 'patientId'], 'status'),
      entity('followups', ['Follow-up', 'Seguimiento'], ['Follow-ups', 'Seguimientos'], 'note', [
        field('patientId', 'text', 'Patient', 'Paciente', { required: true }),
        field('note', 'textarea', 'Note', 'Nota', { required: true }),
        field('due', 'date', 'Due', 'Vence', { required: true }),
        field('status', 'status', 'Status', 'Estado', {
          options: [
            { value: 'open', label: text('Open', 'Abierto') },
            { value: 'done', label: text('Done', 'Hecho') },
          ],
        }),
      ], ['note', 'patientId'], 'status'),
    ],
    metrics: [
      { id: 'patients', label: text('Patients', 'Pacientes'), kind: 'count', entity: 'patients' },
      { id: 'appointments', label: text('Appointments', 'Citas'), kind: 'count', entity: 'appointments' },
      {
        id: 'open-followups',
        label: text('Open follow-ups', 'Seguimientos abiertos'),
        kind: 'countWhere',
        entity: 'followups',
        field: 'status',
        equals: 'open',
        minComplexity: 'professional',
      },
    ],
    charts: [
      {
        id: 'week',
        label: text('Appointments this demonstration week', 'Citas de la semana de demostración'),
        minComplexity: 'professional',
        points: [
          { label: text('Mon', 'Lun'), value: 6 },
          { label: text('Tue', 'Mar'), value: 8 },
          { label: text('Wed', 'Mié'), value: 5 },
          { label: text('Thu', 'Jue'), value: 9 },
          { label: text('Fri', 'Vie'), value: 4 },
        ],
      },
    ],
    seed: {
      patients: [
        { id: 'pat-mara', name: 'Mara Ellison', mrn: 'HL-1008', status: 'active' },
        { id: 'pat-jonah', name: 'Jonah Peck', mrn: 'HL-1014', status: 'active' },
        { id: 'pat-inez', name: 'Inez Calder', mrn: 'HL-1022', status: 'active' },
        { id: 'pat-otto', name: 'Otto Bram', mrn: 'HL-1030', status: 'inactive' },
      ],
      professionals: [
        { id: 'pro-leona', name: 'Leona Voss', role: 'Physician' },
        { id: 'pro-amir', name: 'Amir Shah', role: 'Physician' },
        { id: 'pro-carla', name: 'Carla Ruiz', role: 'Nurse practitioner' },
      ],
      appointments: [
        { id: 'apt-1', patientId: 'pat-mara', professionalId: 'pro-leona', start: '2026-04-13T09:00:00.000Z', reason: 'Blood pressure review', status: 'confirmed' },
        { id: 'apt-2', patientId: 'pat-jonah', professionalId: 'pro-amir', start: '2026-04-13T10:30:00.000Z', reason: 'Post-visit check', status: 'requested' },
        { id: 'apt-3', patientId: 'pat-inez', professionalId: 'pro-carla', start: '2026-04-14T15:00:00.000Z', reason: 'Medication review', status: 'confirmed' },
      ],
      followups: [
        { id: 'fu-1', patientId: 'pat-mara', note: 'Confirm home reading log', due: '2026-04-20', status: 'open' },
        { id: 'fu-2', patientId: 'pat-inez', note: 'Lab slip handed to patient', due: '2026-04-16', status: 'done' },
      ],
    },
  },
  {
    id: 'retail-commerce',
    industry: 'retail',
    solution: 'ecommerce',
    engine: 'retail',
    summary: text(
      'Harborline Supply: a catalog, a cart, and orders that change stock.',
      'Harborline Supply: un catálogo, un carrito y pedidos que cambian la existencia.',
    ),
    optionalModules: ['inventory', 'payments', 'analytics'],
    workflows: [text('Add to cart, change quantity, and simulate checkout.', 'Añadir al carrito, cambiar la cantidad y simular la compra.')],
    navigation: [
      nav('dashboard', 'Board', 'Tablero', 'cart', 'dashboard'),
      nav('catalog', 'Catalog', 'Catálogo', 'cart', 'custom', { custom: 'retail-catalog' }),
      nav('orders', 'Orders', 'Pedidos', 'layers', 'entity', { entityKey: 'orders' }),
      nav('customers', 'Customers', 'Clientes', 'card', 'entity', { entityKey: 'customers' }),
    ],
    entities: [
      entity('products', ['Product', 'Producto'], ['Products', 'Productos'], 'name', [
        field('sku', 'text', 'SKU', 'SKU', { required: true }),
        field('name', 'text', 'Name', 'Nombre', { required: true }),
        field('category', 'text', 'Category', 'Categoría', { filterable: true }),
        field('priceCents', 'currency', 'Price', 'Precio', { required: true, min: 0 }),
        field('stock', 'number', 'Shop stock', 'Existencia en tienda', { required: true, min: 0 }),
      ], ['name', 'sku', 'category']),
      entity('orders', ['Order', 'Pedido'], ['Orders', 'Pedidos'], 'number', [
        field('number', 'text', 'Number', 'Número'),
        field('customerName', 'text', 'Customer', 'Cliente'),
        field('summary', 'text', 'Summary', 'Resumen'),
        field('totalCents', 'currency', 'Total', 'Total'),
        orderStatus,
      ], ['number', 'customerName', 'summary'], 'status'),
      entity('customers', ['Customer', 'Cliente'], ['Customers', 'Clientes'], 'name', [
        field('name', 'text', 'Name', 'Nombre', { required: true }),
        field('city', 'text', 'City', 'Ciudad'),
      ], ['name', 'city']),
    ],
    metrics: [
      { id: 'products', label: text('Products', 'Productos'), kind: 'count', entity: 'products' },
      { id: 'orders', label: text('Orders', 'Pedidos'), kind: 'count', entity: 'orders' },
      {
        id: 'stock-value',
        label: text('Catalog units', 'Unidades del catálogo'),
        kind: 'sum',
        entity: 'products',
        field: 'stock',
        minComplexity: 'professional',
      },
    ],
    charts: [
      {
        id: 'sales',
        label: text('Demonstration sales, units', 'Ventas de demostración, unidades'),
        minComplexity: 'professional',
        points: [
          { label: text('Mon', 'Lun'), value: 14 },
          { label: text('Tue', 'Mar'), value: 11 },
          { label: text('Wed', 'Mié'), value: 18 },
          { label: text('Thu', 'Jue'), value: 9 },
          { label: text('Fri', 'Vie'), value: 16 },
        ],
      },
    ],
    seed: {
      products: [
        { id: 'prd-note', sku: 'NT-1', name: 'Field notebook', category: 'Stationery', priceCents: 1800, stock: 18 },
        { id: 'prd-lamp', sku: 'LM-2', name: 'Desk lamp', category: 'Home', priceCents: 6400, stock: 7 },
        { id: 'prd-mug', sku: 'MG-3', name: 'Stone mug', category: 'Home', priceCents: 2400, stock: 20 },
        { id: 'prd-apron', sku: 'AP-8', name: 'Shop apron', category: 'Workwear', priceCents: 4200, stock: 5 },
      ],
      orders: [
        { id: 'ord-seed', number: 'SO-1001', customerName: 'Nia Pell', summary: '1 × Field notebook', totalCents: 1800, status: 'complete' },
      ],
      customers: [
        { id: 'cus-nia', name: 'Nia Pell', city: 'Harborline' },
        { id: 'cus-ed', name: 'Edwin Cho', city: 'Harborline' },
      ],
    },
  },
  {
    id: 'manufacturing-mes',
    industry: 'manufacturing',
    solution: 'mes',
    engine: 'manufacturing',
    summary: text(
      'Harborline Fabrication: work orders, machines, downtime, and a simulated robot cell.',
      'Harborline Fabrication: órdenes, máquinas, paros y una celda robótica simulada.',
    ),
    optionalModules: ['inventory', 'maintenance', 'iot-monitoring', 'robotics-cell', 'analytics'],
    workflows: [
      text('Release a work order, record downtime, and complete the run.', 'Liberar una orden, registrar un paro y completar la corrida.'),
    ],
    roles: [
      { id: 'supervisor', label: text('Supervisor', 'Supervisor'), allow: ['*'] },
      {
        id: 'operator',
        label: text('Operator', 'Operador'),
        allow: ['workorder.downtime', 'workorder.complete', 'workorder.submit', 'robot.jog', 'robot.estop', 'robot.reset', 'record.update'],
      },
      { id: 'viewer', label: text('Viewer', 'Consulta'), allow: [] },
    ],
    navigation: [
      nav('dashboard', 'Board', 'Tablero', 'factory', 'dashboard'),
      nav('orders', 'Work orders', 'Órdenes de trabajo', 'factory', 'board', { entityKey: 'work_orders' }),
      nav('machines', 'Machines', 'Máquinas', 'chip', 'entity', { entityKey: 'machines' }),
      nav('lines', 'Lines', 'Líneas', 'layers', 'entity', { entityKey: 'lines' }),
      nav('downtime', 'Downtime', 'Paros', 'bolt', 'entity', { entityKey: 'downtime' }),
    ],
    entities: [
      entity('work_orders', ['Work order', 'Orden de trabajo'], ['Work orders', 'Órdenes de trabajo'], 'number', [
        field('number', 'text', 'Number', 'Número', { required: true }),
        field('product', 'text', 'Product', 'Producto', { required: true }),
        field('line', 'text', 'Line', 'Línea'),
        field('quantity', 'number', 'Quantity', 'Cantidad', { min: 1 }),
        field('materialSku', 'text', 'Material SKU', 'SKU de material'),
        field('materialQty', 'number', 'Material quantity', 'Cantidad de material', { min: 0 }),
        workStatus,
      ], ['number', 'product', 'line'], 'status'),
      entity('machines', ['Machine', 'Máquina'], ['Machines', 'Máquinas'], 'name', [
        field('name', 'text', 'Name', 'Nombre', { required: true }),
        field('line', 'text', 'Line', 'Línea'),
        field('status', 'status', 'Status', 'Estado', {
          filterable: true,
          options: [
            { value: 'running', label: text('Running', 'En marcha') },
            { value: 'idle', label: text('Idle', 'En espera') },
            { value: 'down', label: text('Down', 'Detenida') },
          ],
        }),
      ], ['name', 'line'], 'status'),
      entity('lines', ['Line', 'Línea'], ['Lines', 'Líneas'], 'name', [
        field('name', 'text', 'Name', 'Nombre', { required: true }),
        field('shift', 'text', 'Shift', 'Turno'),
      ], ['name']),
      entity('downtime', ['Downtime', 'Paro'], ['Downtime', 'Paros'], 'reason', [
        field('workOrderId', 'text', 'Work order', 'Orden'),
        field('minutes', 'number', 'Minutes', 'Minutos', { min: 1 }),
        field('reason', 'text', 'Reason', 'Motivo', { required: true }),
        field('status', 'status', 'Status', 'Estado', {
          options: [
            { value: 'open', label: text('Open', 'Abierto') },
            { value: 'closed', label: text('Closed', 'Cerrado') },
          ],
        }),
      ], ['reason'], 'status'),
    ],
    metrics: [
      { id: 'orders', label: text('Work orders', 'Órdenes'), kind: 'count', entity: 'work_orders' },
      {
        id: 'running',
        label: text('In progress', 'En curso'),
        kind: 'countWhere',
        entity: 'work_orders',
        field: 'status',
        equals: 'in_progress',
      },
      {
        id: 'down',
        label: text('Machines down', 'Máquinas detenidas'),
        kind: 'countWhere',
        entity: 'machines',
        field: 'status',
        equals: 'down',
        minComplexity: 'professional',
      },
    ],
    charts: [
      {
        id: 'output',
        label: text('Demonstration output, units', 'Producción de demostración, unidades'),
        minComplexity: 'professional',
        points: [
          { label: text('Mon', 'Lun'), value: 120 },
          { label: text('Tue', 'Mar'), value: 140 },
          { label: text('Wed', 'Mié'), value: 90 },
          { label: text('Thu', 'Jue'), value: 150 },
          { label: text('Fri', 'Vie'), value: 130 },
        ],
      },
    ],
    seed: {
      lines: [
        { id: 'line-a', name: 'Line A', shift: 'Day' },
        { id: 'line-b', name: 'Line B', shift: 'Day' },
      ],
      machines: [
        { id: 'mc-press', name: 'Press 1', line: 'Line A', status: 'running' },
        { id: 'mc-weld', name: 'Weld cell', line: 'Line A', status: 'idle' },
        { id: 'mc-saw', name: 'Saw 2', line: 'Line B', status: 'down' },
      ],
      work_orders: [
        { id: 'wo-104', number: 'WO-104', product: 'Bracket', line: 'Line A', quantity: 20, materialSku: 'STL-1', materialQty: 4, status: 'draft' },
        { id: 'wo-105', number: 'WO-105', product: 'Cover plate', line: 'Line A', quantity: 10, materialSku: 'STL-1', materialQty: 2, status: 'in_progress' },
        { id: 'wo-106', number: 'WO-106', product: 'Guard', line: 'Line B', quantity: 6, materialSku: 'FST-4', materialQty: 6, status: 'released' },
      ],
      downtime: [
        { id: 'dt-1', workOrderId: 'wo-106', minutes: 25, reason: 'Saw guard sensor', status: 'open' },
      ],
    },
  },
  {
    id: 'logistics-fleet',
    industry: 'logistics',
    solution: 'fleet',
    engine: 'logistics',
    summary: text(
      'Harborline Freight: vehicles, drivers, and shipments with simulated progress.',
      'Harborline Freight: vehículos, conductores y envíos con un avance simulado.',
    ),
    optionalModules: ['maintenance', 'analytics'],
    workflows: [text('Assign a shipment and mark it delivered.', 'Asignar un envío y marcarlo entregado.')],
    roles: [
      { id: 'dispatcher', label: text('Dispatcher', 'Despacho'), allow: ['*'] },
      { id: 'driver', label: text('Driver', 'Conductor'), allow: ['shipment.deliver', 'record.update'] },
    ],
    navigation: [
      nav('dashboard', 'Board', 'Tablero', 'truck', 'dashboard'),
      nav('shipments', 'Shipments', 'Envíos', 'truck', 'board', { entityKey: 'shipments' }),
      nav('vehicles', 'Vehicles', 'Vehículos', 'car', 'entity', { entityKey: 'vehicles' }),
      nav('drivers', 'Drivers', 'Conductores', 'briefcase', 'entity', { entityKey: 'drivers' }),
      nav('orders', 'Linked orders', 'Pedidos vinculados', 'layers', 'entity', { entityKey: 'orders' }),
    ],
    entities: [
      entity('shipments', ['Shipment', 'Envío'], ['Shipments', 'Envíos'], 'reference', [
        field('reference', 'text', 'Reference', 'Referencia', { required: true }),
        field('destination', 'text', 'Destination', 'Destino', { required: true }),
        field('vehicleId', 'text', 'Vehicle', 'Vehículo'),
        field('driverId', 'text', 'Driver', 'Conductor'),
        field('orderRef', 'text', 'Order', 'Pedido'),
        shipmentStatus,
      ], ['reference', 'destination', 'orderRef'], 'status'),
      entity('vehicles', ['Vehicle', 'Vehículo'], ['Vehicles', 'Vehículos'], 'name', [
        field('name', 'text', 'Name', 'Nombre', { required: true }),
        field('plate', 'text', 'Plate', 'Placa'),
        field('status', 'status', 'Status', 'Estado', {
          filterable: true,
          options: [
            { value: 'available', label: text('Available', 'Disponible') },
            { value: 'assigned', label: text('Assigned', 'Asignado') },
            { value: 'maintenance', label: text('Maintenance', 'Mantenimiento') },
          ],
        }),
      ], ['name', 'plate'], 'status'),
      entity('drivers', ['Driver', 'Conductor'], ['Drivers', 'Conductores'], 'name', [
        field('name', 'text', 'Name', 'Nombre', { required: true }),
        field('status', 'status', 'Status', 'Estado', {
          options: [
            { value: 'available', label: text('Available', 'Disponible') },
            { value: 'assigned', label: text('Assigned', 'Asignado') },
          ],
        }),
      ], ['name'], 'status'),
      entity('orders', ['Order', 'Pedido'], ['Orders', 'Pedidos'], 'reference', [
        field('reference', 'text', 'Reference', 'Referencia'),
        field('destination', 'text', 'Destination', 'Destino'),
        field('status', 'status', 'Status', 'Estado', {
          options: [
            { value: 'picking', label: text('Picking', 'En preparación') },
            { value: 'shipped', label: text('Shipped', 'Enviado') },
            { value: 'delivered', label: text('Delivered', 'Entregado') },
          ],
        }),
      ], ['reference', 'destination'], 'status'),
    ],
    metrics: [
      { id: 'shipments', label: text('Shipments', 'Envíos'), kind: 'count', entity: 'shipments' },
      {
        id: 'available',
        label: text('Vehicles available', 'Vehículos disponibles'),
        kind: 'countWhere',
        entity: 'vehicles',
        field: 'status',
        equals: 'available',
      },
      {
        id: 'transit',
        label: text('In transit', 'En tránsito'),
        kind: 'countWhere',
        entity: 'shipments',
        field: 'status',
        equals: 'in_transit',
        minComplexity: 'professional',
      },
    ],
    charts: [
      {
        id: 'deliveries',
        label: text('Demonstration deliveries', 'Entregas de demostración'),
        minComplexity: 'professional',
        points: [
          { label: text('Mon', 'Lun'), value: 12 },
          { label: text('Tue', 'Mar'), value: 15 },
          { label: text('Wed', 'Mié'), value: 9 },
          { label: text('Thu', 'Jue'), value: 14 },
          { label: text('Fri', 'Vie'), value: 11 },
        ],
      },
    ],
    seed: {
      vehicles: [
        { id: 'veh-1', name: 'Van 12', plate: 'HL-412', status: 'available' },
        { id: 'veh-2', name: 'Truck 4', plate: 'HL-220', status: 'available' },
        { id: 'veh-3', name: 'Van 7', plate: 'HL-118', status: 'maintenance' },
      ],
      drivers: [
        { id: 'drv-ada', name: 'Ada Quill', status: 'available' },
        { id: 'drv-leo', name: 'Leo Marsh', status: 'available' },
      ],
      shipments: [
        { id: 'shp-1', reference: 'SH-501', destination: 'North yard', vehicleId: '', driverId: '', orderRef: 'HL-440', status: 'pending' },
        { id: 'shp-2', reference: 'SH-502', destination: 'Pier warehouse', vehicleId: 'veh-2', driverId: 'drv-leo', orderRef: 'HL-441', status: 'in_transit' },
      ],
      orders: [
        { id: 'ord-440', reference: 'HL-440', destination: 'North yard', status: 'picking' },
        { id: 'ord-441', reference: 'HL-441', destination: 'Pier warehouse', status: 'shipped' },
      ],
    },
  },
  {
    id: 'realestate-crm',
    industry: 'real-estate',
    solution: 'crm',
    engine: 'realestate',
    summary: text(
      'Harborline Properties: leads, agents, viewings, and a sales pipeline.',
      'Harborline Properties: prospectos, agentes, visitas y un embudo de ventas.',
    ),
    optionalModules: ['analytics', 'customer-portal'],
    workflows: [text('Create a lead, assign an agent, schedule a viewing, and move the deal.', 'Crear un prospecto, asignar un agente, programar una visita y mover la operación.')],
    roles: [
      { id: 'broker', label: text('Broker', 'Corredor'), allow: ['*'] },
      { id: 'agent', label: text('Agent', 'Agente'), allow: ['lead.create', 'viewing.schedule', 'deal.stage', 'record.update'] },
    ],
    navigation: [
      nav('dashboard', 'Board', 'Tablero', 'home', 'dashboard'),
      nav('pipeline', 'Pipeline', 'Embudo', 'layers', 'board', { entityKey: 'leads' }),
      nav('properties', 'Properties', 'Inmuebles', 'home', 'entity', { entityKey: 'properties' }),
      nav('agents', 'Agents', 'Agentes', 'briefcase', 'entity', { entityKey: 'agents' }),
      nav('viewings', 'Viewings', 'Visitas', 'book', 'entity', { entityKey: 'viewings' }),
    ],
    entities: [
      entity('leads', ['Lead', 'Prospecto'], ['Leads', 'Prospectos'], 'name', [
        field('name', 'text', 'Name', 'Nombre', { required: true }),
        field('interest', 'text', 'Interest', 'Interés'),
        field('agentId', 'text', 'Agent', 'Agente'),
        dealStatus,
      ], ['name', 'interest'], 'status'),
      entity('properties', ['Property', 'Inmueble'], ['Properties', 'Inmuebles'], 'name', [
        field('name', 'text', 'Name', 'Nombre', { required: true }),
        field('district', 'text', 'District', 'Distrito'),
        field('status', 'status', 'Status', 'Estado', {
          filterable: true,
          options: [
            { value: 'available', label: text('Available', 'Disponible') },
            { value: 'under_offer', label: text('Under offer', 'En oferta') },
            { value: 'closed', label: text('Closed', 'Cerrado') },
          ],
        }),
      ], ['name', 'district'], 'status'),
      entity('agents', ['Agent', 'Agente'], ['Agents', 'Agentes'], 'name', [
        field('name', 'text', 'Name', 'Nombre', { required: true }),
        field('desk', 'text', 'Desk', 'Mesa'),
      ], ['name']),
      entity('viewings', ['Viewing', 'Visita'], ['Viewings', 'Visitas'], 'start', [
        field('leadId', 'text', 'Lead', 'Prospecto', { required: true }),
        field('propertyId', 'text', 'Property', 'Inmueble', { required: true }),
        field('agentId', 'text', 'Agent', 'Agente', { required: true }),
        field('start', 'date', 'When', 'Cuándo', { required: true }),
        field('status', 'status', 'Status', 'Estado', {
          options: [
            { value: 'scheduled', label: text('Scheduled', 'Programada') },
            { value: 'done', label: text('Done', 'Hecha') },
          ],
        }),
      ], ['leadId', 'propertyId'], 'status'),
    ],
    metrics: [
      { id: 'leads', label: text('Leads', 'Prospectos'), kind: 'count', entity: 'leads' },
      {
        id: 'viewings',
        label: text('Viewings', 'Visitas'),
        kind: 'count',
        entity: 'viewings',
      },
      {
        id: 'offers',
        label: text('Offers', 'Ofertas'),
        kind: 'countWhere',
        entity: 'leads',
        field: 'status',
        equals: 'offer',
        minComplexity: 'professional',
      },
    ],
    charts: [
      {
        id: 'pipeline',
        label: text('Pipeline, demonstration counts', 'Embudo, conteos de demostración'),
        minComplexity: 'professional',
        points: [
          { label: text('New', 'Nuevos'), value: 4 },
          { label: text('Viewing', 'Visita'), value: 3 },
          { label: text('Offer', 'Oferta'), value: 2 },
          { label: text('Won', 'Ganadas'), value: 1 },
        ],
      },
    ],
    seed: {
      properties: [
        { id: 'prop-wharf', name: 'Wharf loft 3', district: 'Wharf', status: 'available' },
        { id: 'prop-kiln', name: 'Kiln house', district: 'Old kiln', status: 'available' },
        { id: 'prop-yard', name: 'Yard cottage', district: 'North yard', status: 'under_offer' },
      ],
      agents: [
        { id: 'agt-elena', name: 'Elena Voss', desk: 'Wharf' },
        { id: 'agt-sam', name: 'Samir Adey', desk: 'Old kiln' },
      ],
      leads: [
        { id: 'lead-ruth', name: 'Ruth Calder', interest: 'Wharf loft', agentId: 'agt-elena', status: 'qualified' },
        { id: 'lead-pio', name: 'Pio Navarro', interest: 'Yard cottage', agentId: 'agt-sam', status: 'offer' },
        { id: 'lead-ana', name: 'Ana Beck', interest: 'Undecided', agentId: '', status: 'new' },
      ],
      viewings: [
        { id: 'view-1', leadId: 'lead-ruth', propertyId: 'prop-wharf', agentId: 'agt-elena', start: '2026-04-15T16:00:00.000Z', status: 'scheduled' },
      ],
    },
  },
  {
    id: 'agriculture-iot',
    industry: 'agriculture',
    solution: 'iot',
    engine: 'agriculture',
    summary: text(
      'Harborline Fields: simulated soil, climate, irrigation, and device diagnostics.',
      'Campos Harborline: suelo, clima, riego y diagnóstico de dispositivos simulados.',
    ),
    optionalModules: ['iot-monitoring', 'embedded-diagnostics', 'maintenance', 'analytics'],
    workflows: [
      text('Simulate telemetry, cross a moisture threshold, and run irrigation.', 'Simular telemetría, cruzar un umbral de humedad y poner el riego en marcha.'),
    ],
    navigation: [
      nav('dashboard', 'Board', 'Tablero', 'leaf', 'dashboard'),
      nav('field', 'Field', 'Campo', 'leaf', 'custom', { custom: 'agriculture-field' }),
      nav('devices', 'Devices', 'Dispositivos', 'chip', 'entity', { entityKey: 'devices' }),
      nav('readings', 'Readings', 'Lecturas', 'signal', 'entity', { entityKey: 'readings' }),
    ],
    entities: [
      entity('devices', ['Device', 'Dispositivo'], ['Devices', 'Dispositivos'], 'name', [
        field('name', 'text', 'Name', 'Nombre', { required: true }),
        field('block', 'text', 'Block', 'Cuadro'),
        field('moisture', 'number', 'Soil moisture', 'Humedad del suelo', { min: 0, max: 100 }),
        field('tempC', 'number', 'Temperature °C', 'Temperatura °C'),
        field('humidity', 'number', 'Humidity', 'Humedad del aire', { min: 0, max: 100 }),
        field('thresholdMoisture', 'number', 'Moisture threshold', 'Umbral de humedad', { min: 0, max: 100 }),
        field('irrigation', 'status', 'Irrigation', 'Riego', {
          options: [
            { value: 'off', label: text('Off', 'Detenido') },
            { value: 'running', label: text('Running', 'En marcha') },
          ],
        }),
        field('status', 'status', 'Link', 'Enlace', {
          filterable: true,
          options: [
            { value: 'online', label: text('Online', 'En línea') },
            { value: 'degraded', label: text('Degraded', 'Degradado') },
            { value: 'offline', label: text('Offline', 'Fuera de línea') },
          ],
        }),
        field('firmware', 'text', 'Firmware', 'Firmware'),
      ], ['name', 'block', 'firmware'], 'status'),
      entity('readings', ['Reading', 'Lectura'], ['Readings', 'Lecturas'], 'deviceId', [
        field('deviceId', 'text', 'Device', 'Dispositivo', { form: false }),
        field('moisture', 'number', 'Moisture', 'Humedad', { form: false }),
        field('tempC', 'number', 'Temperature', 'Temperatura', { form: false }),
        field('humidity', 'number', 'Humidity', 'Humedad del aire', { form: false }),
      ], ['deviceId']),
    ],
    metrics: [
      {
        id: 'online',
        label: text('Devices online', 'Dispositivos en línea'),
        kind: 'countWhere',
        entity: 'devices',
        field: 'status',
        equals: 'online',
      },
      {
        id: 'irrigating',
        label: text('Irrigation running', 'Riego en marcha'),
        kind: 'countWhere',
        entity: 'devices',
        field: 'irrigation',
        equals: 'running',
      },
      { id: 'readings', label: text('Readings', 'Lecturas'), kind: 'count', entity: 'readings', minComplexity: 'professional' },
    ],
    charts: [
      {
        id: 'moisture',
        label: text('Block A moisture, demonstration history', 'Humedad del cuadro A, historial de demostración'),
        minComplexity: 'professional',
        points: [
          { label: text('06:00', '06:00'), value: 41 },
          { label: text('09:00', '09:00'), value: 36 },
          { label: text('12:00', '12:00'), value: 33 },
          { label: text('15:00', '15:00'), value: 29 },
        ],
      },
    ],
    seed: {
      devices: [
        { id: 'dev-a', name: 'Block A probe', block: 'A', moisture: 40, tempC: 21.4, humidity: 62, thresholdMoisture: 35, irrigation: 'off', status: 'online', firmware: 'sim-fw-0.9.2' },
        { id: 'dev-b', name: 'Block B probe', block: 'B', moisture: 48, tempC: 20.1, humidity: 70, thresholdMoisture: 30, irrigation: 'off', status: 'online', firmware: 'sim-fw-0.9.2' },
        { id: 'dev-c', name: 'Pump house node', block: 'Pump', moisture: 40, tempC: 19.0, humidity: 66, thresholdMoisture: 20, irrigation: 'off', status: 'offline', firmware: 'sim-fw-0.8.1' },
      ],
      readings: [
        { id: 'rd-1', deviceId: 'dev-a', moisture: 34, tempC: 20.2, humidity: 64 },
        { id: 'rd-2', deviceId: 'dev-a', moisture: 31, tempC: 21.0, humidity: 63 },
      ],
    },
  },
];
