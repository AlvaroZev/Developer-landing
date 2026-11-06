import {
  text,
  type ActionError,
  type Complexity,
  type DemoAction,
  type DemoState,
  type DomainEvent,
  type EntityRecord,
  type EntitySchema,
} from '@triunder/domain';
import { getModule, planAddition, planRemoval } from '@triunder/module-system';
import { applyEffects } from './effects';
import { attachModule, definitionFor, detachModule, resolveModules, schemasFor } from './session';
import type { DemoDefinition } from './types';

/**
 * Single reducer for every demonstration.
 *
 * Specialized engines return a result when they recognize an action and
 * `null` when the shared record operations should handle it. Cross-module
 * work happens afterwards, from events, in ./effects.ts.
 *
 * Role checks apply only at enterprise complexity. They simulate a
 * department inside the fictional application. They are not platform
 * authorization — that lives in the API.
 */
export interface ReduceResult {
  state: DemoState;
  error?: ActionError;
  events: DomainEvent[];
}

const JOG = new Set([-20, -10, 10, 20]);

export function applyAction(state: DemoState, action: DemoAction): ReduceResult {
  const definition = definitionFor(state);
  if (!definition) {
    return { state, events: [], error: error('unsupported', 'This demonstration is not available.', 'Esta demostración no está disponible.') };
  }
  if (!permitted(state, definition, action)) {
    return {
      state,
      events: [],
      error: error('forbidden_in_simulated_role', 'The simulated role cannot perform this action.', 'El rol simulado no puede realizar esta acción.'),
    };
  }

  const result = dispatch(state, definition, action);
  if (result.error) return result;
  const effected = applyEffects(result.state, result.events);
  const audited = shouldAudit(action) ? withAudit(effected, action) : effected;
  return { state: audited, events: result.events };
}

export function cartTotalCents(state: DemoState): number {
  return state.cart.reduce((sum, line) => {
    const product = (state.entities.products ?? []).find((item) => item.id === line.productId);
    return sum + Number(product?.priceCents ?? 0) * line.quantity;
  }, 0);
}

/** Fixed-step field model. Irrigation adds moisture; a dry step removes it. */
export function nextFieldReading(
  device: { moisture: number; tempC: number; humidity: number; irrigation: string },
): { moisture: number; tempC: number; humidity: number } {
  const running = device.irrigation === 'running';
  return {
    moisture: clamp(Math.round(device.moisture + (running ? 8 : -6)), 0, 100),
    tempC: clamp(Math.round((device.tempC + (running ? -0.3 : 0.4)) * 10) / 10, -5, 45),
    humidity: clamp(Math.round(device.humidity + (running ? 3 : -1)), 10, 100),
  };
}

function dispatch(state: DemoState, definition: DemoDefinition, action: DemoAction): ReduceResult {
  const shell = shellAction(state, definition, action);
  if (shell) return shell;
  if (action.type === 'special' && action.name.startsWith('robot.')) return robotAction(state, action);
  const specialized = specializedAction(state, definition, action);
  if (specialized) return specialized;
  return genericAction(state, definition, action);
}

function shellAction(state: DemoState, definition: DemoDefinition, action: DemoAction): ReduceResult | null {
  if (action.type === 'mark_notifications_read') {
    return ok({
      ...state,
      notifications: state.notifications.map((note) => ({ ...note, read: true })),
    });
  }
  if (action.type === 'set_complexity') return setComplexity(state, definition, action.complexity);
  if (action.type === 'set_role') return setRole(state, definition, action.roleId);
  if (action.type === 'add_module') return addModule(state, definition, action.moduleId, action.withDependencies === true);
  if (action.type === 'remove_module') return removeModule(state, action.moduleId, action.force === true);
  return null;
}

function setComplexity(state: DemoState, definition: DemoDefinition, complexity: Complexity): ReduceResult {
  const simulatedRole =
    complexity === 'enterprise' ? (state.simulatedRole ?? definition.roles?.[0]?.id ?? null) : null;
  return ok(notify({ ...state, complexity, simulatedRole }, 'info', text('Depth changed', 'Profundidad cambiada'), text(
    `The demonstration is now ${complexity}.`,
    `La demostración está ahora en nivel ${complexity}.`,
  )));
}

function setRole(state: DemoState, definition: DemoDefinition, roleId: string): ReduceResult {
  if (state.complexity !== 'enterprise') {
    return fail(state, 'roles_are_enterprise', 'Simulated roles appear at enterprise depth.', 'Los roles simulados aparecen en el nivel empresa.');
  }
  const role = definition.roles?.find((item) => item.id === roleId);
  if (!role) return fail(state, 'unknown_role', 'That role is not part of this demonstration.', 'Ese rol no forma parte de esta demostración.');
  return ok({ ...state, simulatedRole: role.id });
}

function addModule(state: DemoState, definition: DemoDefinition, moduleId: string, withDependencies: boolean): ReduceResult {
  const planned = planAddition(state.modules, moduleId, definition.solution, definition.industry, withDependencies);
  if (!planned.ok) {
    const code =
      planned.code === 'dependency'
        ? 'module_dependency'
        : planned.code === 'conflict'
          ? 'module_conflict'
          : 'module_rejected';
    return fail(state, code, 'That module cannot be added to this demonstration.', 'Ese módulo no se puede añadir a esta demostración.');
  }
  let next = state;
  for (const id of planned.activate) {
    const module = getModule(id);
    if (module) next = attachModule(next, module);
  }
  return ok(notify(next, 'info', text('Module added', 'Módulo añadido'), text(moduleId, moduleId)));
}

function removeModule(state: DemoState, moduleId: string, force: boolean): ReduceResult {
  const planned = planRemoval(state.modules, moduleId, force);
  if (!planned.ok) {
    return fail(
      state,
      planned.code === 'dependents' ? 'module_dependents' : 'module_rejected',
      'That module cannot be removed yet.',
      'Ese módulo todavía no se puede quitar.',
    );
  }
  let next = state;
  for (const id of planned.remove) next = detachModule(next, id);
  return ok(next);
}

function specializedAction(state: DemoState, definition: DemoDefinition, action: DemoAction): ReduceResult | null {
  if (definition.engine === 'retail' && (action.type === 'cart_add' || action.type === 'cart_set_qty' || action.type === 'checkout')) {
    return retailCart(state, action);
  }
  if (action.type !== 'special') return null;
  switch (definition.engine) {
    case 'healthcare':
      return healthcare(state, action.name, action.payload);
    case 'manufacturing':
      return manufacturing(state, action.name, action.payload);
    case 'logistics':
      return logistics(state, action.name, action.payload);
    case 'realestate':
      return realestate(state, action.name, action.payload);
    case 'agriculture':
      return agriculture(state, action.name, action.payload);
    case 'booking':
      return booking(state, definition, action.name, action.payload);
    case 'telemetry':
      return telemetry(state, definition, action.name, action.payload);
    default:
      return null;
  }
}

function healthcare(state: DemoState, name: string, payload: Record<string, unknown>): ReduceResult | null {
  if (name === 'appointment.create') {
    const patientId = String(payload.patientId ?? '');
    const professionalId = String(payload.professionalId ?? '');
    const start = String(payload.start ?? '');
    const reason = String(payload.reason ?? '');
    if (!find(state, 'patients', patientId) || !find(state, 'professionals', professionalId)) {
      return fail(state, 'missing_relation', 'Choose a patient and a clinician from this clinic.', 'Elija un paciente y un clínico de esta clínica.');
    }
    if (!start || !reason.trim()) return fail(state, 'invalid', 'When and a reason are required.', 'Cuándo y un motivo son obligatorios.');
    return insert(state, 'appointments', { patientId, professionalId, start, reason, status: 'requested' }, text('Appointment requested', 'Cita solicitada'));
  }
  if (name === 'appointment.update') {
    const id = String(payload.id ?? '');
    if (!find(state, 'appointments', id)) return missing(state);
    const patch: Record<string, unknown> = {};
    if (typeof payload.status === 'string') patch.status = payload.status;
    if (typeof payload.start === 'string') patch.start = payload.start;
    return patchRecord(state, 'appointments', id, patch, text('Appointment updated', 'Cita actualizada'));
  }
  if (name === 'followup.add') {
    const patientId = String(payload.patientId ?? '');
    const note = String(payload.note ?? '');
    const due = String(payload.due ?? '');
    if (!find(state, 'patients', patientId)) return fail(state, 'missing_relation', 'That patient is not on the list.', 'Ese paciente no está en la lista.');
    if (!note.trim() || !due) return fail(state, 'invalid', 'A follow-up needs a note and a due date.', 'Un seguimiento necesita una nota y una fecha.');
    return insert(state, 'followups', { patientId, note, due, status: 'open' }, text('Follow-up added', 'Seguimiento añadido'));
  }
  return null;
}

function retailCart(state: DemoState, action: DemoAction): ReduceResult {
  if (action.type === 'cart_add' || action.type === 'cart_set_qty') {
    const product = find(state, 'products', action.productId);
    if (!product) return missing(state);
    const stock = Number(product.stock ?? 0);
    const nextQty = action.type === 'cart_add'
      ? (state.cart.find((line) => line.productId === action.productId)?.quantity ?? 0) + action.quantity
      : action.quantity;
    if (action.quantity < 0 || nextQty < 0) return fail(state, 'invalid', 'Quantity cannot be negative.', 'La cantidad no puede ser negativa.');
    if (nextQty > stock) return fail(state, 'stock', 'Not enough stock for this quantity.', 'No hay existencias suficientes para esta cantidad.');
    const cart = state.cart.filter((line) => line.productId !== action.productId);
    if (nextQty > 0) cart.push({ productId: action.productId, quantity: nextQty });
    return ok({ ...state, cart });
  }
  if (action.type !== 'checkout') return fail(state, 'invalid', 'Unsupported cart action.', 'Acción de carrito no admitida.');
  const customerName = action.customerName.trim();
  if (!customerName) return fail(state, 'invalid', 'A customer name is required for the simulation.', 'La simulación necesita un nombre de cliente.', 'customerName');
  if (state.cart.length === 0) return fail(state, 'empty_cart', 'The cart is empty.', 'El carrito está vacío.');
  for (const line of state.cart) {
    const product = find(state, 'products', line.productId);
    if (!product || Number(product.stock ?? 0) < line.quantity) {
      return fail(state, 'stock', 'Not enough stock for this quantity.', 'No hay existencias suficientes para esta cantidad.');
    }
  }
  let next = state;
  const lines: { sku: string; quantity: number }[] = [];
  const summary: string[] = [];
  for (const line of state.cart) {
    const product = find(next, 'products', line.productId);
    if (!product) continue;
    const stock = Number(product.stock ?? 0) - line.quantity;
    next = updateRow(next, 'products', product.id, { stock });
    lines.push({ sku: String(product.sku ?? ''), quantity: line.quantity });
    summary.push(`${line.quantity} × ${String(product.name ?? '')}`);
  }
  const totalCents = cartTotalCents(state);
  const seq = next.seq + 1;
  const number = `SO-${1000 + seq}`;
  const order: EntityRecord = {
    id: `ord-${seq}`,
    number,
    customerName,
    summary: summary.join(', '),
    totalCents,
    status: 'placed',
    createdAt: next.clock,
    updatedAt: next.clock,
  };
  next = {
    ...next,
    seq,
    cart: [],
    entities: { ...next.entities, orders: [...(next.entities.orders ?? []), order] },
  };
  next = notify(next, 'info', text('Simulated order placed', 'Pedido simulado registrado'), text(
    'No payment was processed.',
    'No se procesó ningún pago.',
  ));
  return {
    state: next,
    events: [{ type: 'commerce.order.placed', at: next.clock, payload: { reference: number, totalCents, lines } }],
  };
}

function manufacturing(state: DemoState, name: string, payload: Record<string, unknown>): ReduceResult | null {
  if (name === 'workorder.submit') return submitRelease(state, String(payload.id ?? ''));
  if (name === 'workorder.approve') return releaseOrder(state, String(payload.id ?? ''), true);
  if (name === 'workorder.release') return releaseOrder(state, String(payload.id ?? ''), false);
  if (name === 'workorder.downtime') return downtime(state, payload);
  if (name === 'workorder.complete') return completeOrder(state, String(payload.id ?? ''));
  return null;
}

function submitRelease(state: DemoState, id: string): ReduceResult {
  const order = find(state, 'work_orders', id);
  if (!order) return missing(state);
  if (order.status !== 'draft') return fail(state, 'invalid_transition', 'Only a draft can be submitted.', 'Solo un borrador se puede enviar.');
  let next = updateRow(state, 'work_orders', id, { status: 'awaiting_release' });
  if (next.entities.approvals) {
    const seq = next.seq + 1;
    const approval: EntityRecord = {
      id: `appr-${seq}`,
      title: `Release ${String(order.number ?? id)}`,
      status: 'pending',
      workOrderId: id,
      createdAt: next.clock,
      updatedAt: next.clock,
    };
    next = { ...next, seq, entities: { ...next.entities, approvals: [...(next.entities.approvals ?? []), approval] } };
  }
  return ok(notify(next, 'info', text('Submitted for release', 'Enviada para liberación'), text(String(order.number ?? id), String(order.number ?? id))));
}

function releaseOrder(state: DemoState, id: string, fromApproval: boolean): ReduceResult {
  const order = find(state, 'work_orders', id);
  if (!order) return missing(state);
  if (order.status !== 'draft' && order.status !== 'awaiting_release') {
    return fail(state, 'invalid_transition', 'This order cannot be released from its current status.', 'Esta orden no se puede liberar desde su estado actual.');
  }
  const sku = String(order.materialSku ?? '');
  const quantity = Number(order.materialQty ?? 0);
  if (state.modules.includes('inventory') && sku && quantity > 0) {
    const item = (state.entities.stock_items ?? []).find((row) => row.sku === sku);
    if (!item || Number(item.onHand ?? 0) < quantity) {
      return fail(state, 'stock', 'Not enough material to release this order.', 'No hay material suficiente para liberar esta orden.');
    }
  }
  let next = updateRow(state, 'work_orders', id, { status: 'released' });
  if (fromApproval && next.entities.approvals) {
    next = {
      ...next,
      entities: {
        ...next.entities,
        approvals: (next.entities.approvals ?? []).map((row) =>
          row.workOrderId === id && row.status === 'pending' ? { ...row, status: 'approved', updatedAt: next.clock } : row,
        ),
      },
    };
  }
  next = notify(next, 'info', text('Work order released', 'Orden liberada'), text(String(order.number ?? id), String(order.number ?? id)));
  const events: DomainEvent[] = [];
  if (state.modules.includes('inventory') && sku && quantity > 0) {
    events.push({ type: 'mes.work_order.released', at: next.clock, payload: { id, sku, quantity } });
  }
  return { state: next, events };
}

function downtime(state: DemoState, payload: Record<string, unknown>): ReduceResult {
  const id = String(payload.id ?? '');
  const order = find(state, 'work_orders', id);
  if (!order) return missing(state);
  const minutes = Number(payload.minutes ?? 0);
  const reason = String(payload.reason ?? '').trim();
  if (!reason || minutes <= 0) return fail(state, 'invalid', 'Downtime needs a reason and minutes.', 'Un paro necesita un motivo y minutos.');
  const seq = state.seq + 1;
  const row: EntityRecord = {
    id: `dt-${seq}`,
    workOrderId: id,
    minutes,
    reason,
    status: 'open',
    createdAt: state.clock,
    updatedAt: state.clock,
  };
  let next = updateRow(state, 'work_orders', id, { status: 'blocked' });
  next = {
    ...next,
    seq,
    entities: { ...next.entities, downtime: [...(next.entities.downtime ?? []), row] },
  };
  const machine = (state.entities.machines ?? []).find((item) => item.line === order.line && item.status !== 'down');
  if (machine) next = updateRow(next, 'machines', machine.id, { status: 'down' });
  return ok(notify(next, 'warning', text('Downtime recorded', 'Paro registrado'), text(reason, reason)), [
    { type: 'mes.downtime', at: next.clock, payload: { id, minutes, reason } },
  ]);
}

function completeOrder(state: DemoState, id: string): ReduceResult {
  const order = find(state, 'work_orders', id);
  if (!order) return missing(state);
  if (order.status !== 'released' && order.status !== 'in_progress') {
    return fail(state, 'invalid_transition', 'Release the order before completing it.', 'Libere la orden antes de completarla.');
  }
  const next = notify(updateRow(state, 'work_orders', id, { status: 'completed' }), 'info', text('Work order completed', 'Orden completada'), text(String(order.number ?? id), String(order.number ?? id)));
  return ok(next);
}

function logistics(state: DemoState, name: string, payload: Record<string, unknown>): ReduceResult | null {
  if (name === 'shipment.assign') {
    const shipment = find(state, 'shipments', String(payload.shipmentId ?? ''));
    const vehicle = find(state, 'vehicles', String(payload.vehicleId ?? ''));
    const driver = find(state, 'drivers', String(payload.driverId ?? ''));
    if (!shipment || !vehicle || !driver) return missing(state);
    if (shipment.status !== 'pending') return fail(state, 'invalid_transition', 'Only a pending shipment can be assigned.', 'Solo un envío pendiente se puede asignar.');
    if (vehicle.status !== 'available' || driver.status !== 'available') {
      return fail(state, 'unavailable', 'The vehicle and driver both need to be available.', 'El vehículo y el conductor deben estar disponibles.');
    }
    let next = updateRow(state, 'shipments', shipment.id, { status: 'assigned', vehicleId: vehicle.id, driverId: driver.id });
    next = updateRow(next, 'vehicles', vehicle.id, { status: 'assigned' });
    next = updateRow(next, 'drivers', driver.id, { status: 'assigned' });
    return ok(notify(next, 'info', text('Shipment assigned', 'Envío asignado'), text(String(shipment.reference ?? ''), String(shipment.reference ?? ''))));
  }
  if (name === 'shipment.deliver') {
    const shipment = find(state, 'shipments', String(payload.shipmentId ?? ''));
    if (!shipment) return missing(state);
    if (shipment.status !== 'assigned' && shipment.status !== 'in_transit') {
      return fail(state, 'invalid_transition', 'Assign the shipment before marking it delivered.', 'Asigne el envío antes de marcarlo entregado.');
    }
    let next = updateRow(state, 'shipments', shipment.id, { status: 'delivered' });
    if (shipment.vehicleId) next = updateRow(next, 'vehicles', String(shipment.vehicleId), { status: 'available' });
    if (shipment.driverId) next = updateRow(next, 'drivers', String(shipment.driverId), { status: 'available' });
    next = notify(next, 'info', text('Shipment delivered', 'Envío entregado'), text('Simulated tracking only.', 'Solo seguimiento simulado.'));
    return {
      state: next,
      events: [{ type: 'logistics.shipment.delivered', at: next.clock, payload: { shipmentId: shipment.id, orderRef: String(shipment.orderRef ?? '') } }],
    };
  }
  return null;
}

function realestate(state: DemoState, name: string, payload: Record<string, unknown>): ReduceResult | null {
  if (name === 'lead.create') {
    const nameValue = String(payload.name ?? '').trim();
    if (!nameValue) return fail(state, 'invalid', 'A lead needs a name.', 'Un prospecto necesita un nombre.', 'name');
    return insert(state, 'leads', { name: nameValue, interest: String(payload.interest ?? ''), agentId: '', status: 'new' }, text('Lead created', 'Prospecto creado'));
  }
  if (name === 'viewing.schedule') {
    const lead = find(state, 'leads', String(payload.leadId ?? ''));
    const property = find(state, 'properties', String(payload.propertyId ?? ''));
    const agent = find(state, 'agents', String(payload.agentId ?? ''));
    const start = String(payload.start ?? '');
    if (!lead || !property || !agent) return missing(state);
    if (!start) return fail(state, 'invalid', 'A viewing needs a time.', 'Una visita necesita una hora.');
    const inserted = insert(state, 'viewings', { leadId: lead.id, propertyId: property.id, agentId: agent.id, start, status: 'scheduled' }, text('Viewing scheduled', 'Visita programada'));
    if (inserted.error) return inserted;
    const stage = lead.status === 'new' || lead.status === 'qualified' ? 'viewing' : lead.status;
    return ok(updateRow(inserted.state, 'leads', lead.id, { status: stage, agentId: agent.id }));
  }
  if (name === 'deal.stage') {
    const lead = find(state, 'leads', String(payload.leadId ?? ''));
    const stage = String(payload.stage ?? '');
    if (!lead) return missing(state);
    const allowed = ['new', 'qualified', 'viewing', 'offer', 'won', 'lost'];
    if (!allowed.includes(stage)) return fail(state, 'invalid', 'That stage is not in the pipeline.', 'Esa etapa no está en el embudo.');
    let next = updateRow(state, 'leads', lead.id, { status: stage });
    if (stage === 'won' || stage === 'offer') {
      const viewing = (next.entities.viewings ?? []).find((row) => row.leadId === lead.id);
      const propertyId = viewing ? String(viewing.propertyId) : '';
      const property = propertyId ? find(next, 'properties', propertyId) : undefined;
      if (property) next = updateRow(next, 'properties', property.id, { status: stage === 'won' ? 'closed' : 'under_offer' });
    }
    return ok(notify(next, 'info', text('Deal updated', 'Operación actualizada'), text(stage, stage)));
  }
  return null;
}

function agriculture(state: DemoState, name: string, payload: Record<string, unknown>): ReduceResult | null {
  if (name === 'telemetry.sample') {
    const device = find(state, 'devices', String(payload.deviceId ?? ''));
    if (!device) return missing(state);
    if (device.status === 'offline') return fail(state, 'offline', 'This simulated device is offline.', 'Este dispositivo simulado está fuera de línea.');
    const previous = Number(device.moisture ?? 0);
    const reading = nextFieldReading({
      moisture: previous,
      tempC: Number(device.tempC ?? 0),
      humidity: Number(device.humidity ?? 0),
      irrigation: String(device.irrigation ?? 'off'),
    });
    const seq = state.seq + 1;
    const row: EntityRecord = {
      id: `rd-${seq}`,
      deviceId: device.id,
      ...reading,
      createdAt: state.clock,
      updatedAt: state.clock,
    };
    let next: DemoState = {
      ...updateRow(state, 'devices', device.id, reading),
      seq,
    };
    next = {
      ...next,
      entities: { ...next.entities, readings: [...(next.entities.readings ?? []), row] },
    };
    if (next.entities.telemetry_points) {
      const point: EntityRecord = {
        id: `tel-${seq}`,
        metric: 'moisture',
        value: reading.moisture,
        source: String(device.name ?? device.id),
        createdAt: next.clock,
        updatedAt: next.clock,
      };
      next = { ...next, entities: { ...next.entities, telemetry_points: [...(next.entities.telemetry_points ?? []), point] } };
    }
    const threshold = Number(device.thresholdMoisture ?? 0);
    const breached = previous >= threshold && reading.moisture < threshold;
    const events: DomainEvent[] = [];
    if (breached) {
      next = notify(
        next,
        'critical',
        text('Moisture below threshold', 'Humedad bajo el umbral'),
        text(`${String(device.name)} is simulated, not a live probe.`, `${String(device.name)} es simulado, no es una sonda real.`),
      );
      events.push({
        type: 'iot.threshold.breached',
        at: next.clock,
        payload: { asset: String(device.name ?? device.id), metric: 'moisture', value: reading.moisture },
      });
    }
    return { state: next, events };
  }
  if (name === 'irrigation.set') {
    const device = find(state, 'devices', String(payload.id ?? ''));
    if (!device) return missing(state);
    const running = payload.running === true;
    return ok(updateRow(state, 'devices', device.id, { irrigation: running ? 'running' : 'off' }));
  }
  if (name === 'threshold.set') {
    const device = find(state, 'devices', String(payload.id ?? ''));
    if (!device) return missing(state);
    const moisture = Number(payload.moisture);
    if (!Number.isFinite(moisture) || moisture < 0 || moisture > 100) {
      return fail(state, 'invalid', 'The threshold must be between 0 and 100.', 'El umbral debe estar entre 0 y 100.');
    }
    return ok(updateRow(state, 'devices', device.id, { thresholdMoisture: moisture }));
  }
  if (name === 'device.set_status') {
    const device = find(state, 'devices', String(payload.id ?? ''));
    if (!device) return missing(state);
    const status = String(payload.status ?? '');
    if (!['online', 'degraded', 'offline'].includes(status)) return fail(state, 'invalid', 'Unknown device status.', 'Estado de dispositivo desconocido.');
    return ok(updateRow(state, 'devices', device.id, { status }));
  }
  return null;
}

function booking(state: DemoState, definition: DemoDefinition, name: string, payload: Record<string, unknown>): ReduceResult | null {
  if (name !== 'booking.confirm' || !definition.capacity) return null;
  const entity = definition.capacity.entity;
  const row = find(state, entity, String(payload.id ?? ''));
  if (!row) return missing(state);
  const remaining = Number(row.remaining ?? 0);
  if (remaining <= 0) return fail(state, 'capacity', 'Nothing is left to confirm.', 'No queda cupo para confirmar.');
  const status = remaining - 1 === 0 ? 'full' : 'confirmed';
  const next = updateRow(state, entity, row.id, { remaining: remaining - 1, status });
  return {
    state: notify(next, 'info', text('Booking confirmed', 'Reserva confirmada'), text('Capacity was reduced inside the demonstration.', 'La capacidad se redujo dentro de la demostración.')),
    events: [{
      type: 'booking.confirmed',
      at: next.clock,
      payload: { id: row.id, reference: String(row.name ?? row.id), depositCents: Number(row.depositCents ?? 0) },
    }],
  };
}

function telemetry(state: DemoState, definition: DemoDefinition, name: string, payload: Record<string, unknown>): ReduceResult | null {
  if (name !== 'reading.sample' || !definition.telemetry) return null;
  const hint = definition.telemetry;
  const row = find(state, hint.entity, String(payload.id ?? ''));
  if (!row) return missing(state);
  if (row.status === 'offline') return fail(state, 'offline', 'This simulated meter is offline.', 'Este medidor simulado está fuera de línea.');
  const current = Number(row[hint.valueField] ?? 0);
  const threshold = Number(row[hint.thresholdField] ?? 0);
  const nextValue = hint.direction === 'above' ? current + 15 : current - 15;
  const breached = hint.direction === 'above' ? current <= threshold && nextValue > threshold : current >= threshold && nextValue < threshold;
  let next = updateRow(state, hint.entity, row.id, {
    [hint.valueField]: nextValue,
    status: breached ? 'alarm' : row.status,
  });
  const events: DomainEvent[] = [];
  if (breached) {
    next = notify(next, 'critical', text('Threshold crossed', 'Umbral cruzado'), text(
      'Simulated telemetry. No sensor is connected.',
      'Telemetría simulada. No hay un sensor conectado.',
    ));
    events.push({
      type: 'iot.threshold.breached',
      at: next.clock,
      payload: { asset: String(row.name ?? row.id), metric: hint.metric, value: nextValue },
    });
  }
  return { state: next, events };
}

function robotAction(state: DemoState, action: DemoAction): ReduceResult {
  if (action.type !== 'special') return fail(state, 'invalid', 'Unsupported robot action.', 'Acción de robot no admitida.');
  if (!state.modules.includes('robotics-cell')) {
    return fail(state, 'module_rejected', 'Add the robot cell module first.', 'Añada primero el módulo de celda robótica.');
  }
  const id = String(action.payload.id ?? '');
  const robot = find(state, 'robots', id);
  if (!robot) return missing(state);
  if (action.name === 'robot.estop') {
    return ok(notify(updateRow(state, 'robots', id, { state: 'estop' }), 'critical', text('Emergency stop', 'Parada de emergencia'), text('Simulated stop. No drive is connected.', 'Parada simulada. No hay un accionamiento conectado.')));
  }
  if (action.name === 'robot.reset') {
    if (robot.state !== 'estop') return fail(state, 'invalid_transition', 'Reset follows an emergency stop.', 'El restablecimiento sigue a una parada de emergencia.');
    return ok(updateRow(state, 'robots', id, { state: 'idle' }));
  }
  if (action.name === 'robot.jog') {
    if (robot.state === 'estop') return fail(state, 'estop', 'Reset the emergency stop before moving.', 'Restablezca la parada de emergencia antes de mover.');
    const axis = action.payload.axis === 'y' ? 'y' : action.payload.axis === 'x' ? 'x' : '';
    const delta = Number(action.payload.delta);
    if (!axis || !JOG.has(delta)) return fail(state, 'invalid', 'Jog by 10 or 20 on X or Y.', 'Mueva 10 o 20 en X o Y.');
    const value = clamp(Number(robot[axis] ?? 0) + delta, 0, 100);
    return ok(updateRow(state, 'robots', id, { [axis]: value, state: 'idle' }));
  }
  return fail(state, 'invalid', 'Unsupported robot action.', 'Acción de robot no admitida.');
}

function genericAction(state: DemoState, definition: DemoDefinition, action: DemoAction): ReduceResult {
  if (action.type === 'create') return createRecord(state, definition, action.entity, action.data);
  if (action.type === 'update') return updateRecord(state, definition, action.entity, action.id, action.data);
  if (action.type === 'remove') return removeRecord(state, action.entity, action.id);
  if (action.type === 'set_status') return setStatus(state, definition, action.entity, action.id, action.status);
  return fail(state, 'unsupported_action', 'This demonstration does not support that action.', 'Esta demostración no admite esa acción.');
}

function createRecord(state: DemoState, definition: DemoDefinition, entity: string, data: Record<string, unknown>): ReduceResult {
  const schema = schemaOf(state, definition, entity);
  if (!schema) return fail(state, 'unknown_entity', 'That record type is not in this demonstration.', 'Ese tipo de registro no está en esta demostración.');
  const invalid = validate(schema, data, false);
  if (invalid) return { state, events: [], error: invalid };
  return insert(state, entity, pick(schema, data), text('Record created', 'Registro creado'));
}

function updateRecord(
  state: DemoState,
  definition: DemoDefinition,
  entity: string,
  id: string,
  data: Record<string, unknown>,
): ReduceResult {
  const schema = schemaOf(state, definition, entity);
  if (!schema || !find(state, entity, id)) return missing(state);
  const invalid = validate(schema, data, true);
  if (invalid) return { state, events: [], error: invalid };
  return patchRecord(state, entity, id, pick(schema, data), text('Record updated', 'Registro actualizado'));
}

function removeRecord(state: DemoState, entity: string, id: string): ReduceResult {
  if (!find(state, entity, id)) return missing(state);
  return ok({
    ...state,
    entities: { ...state.entities, [entity]: (state.entities[entity] ?? []).filter((row) => row.id !== id) },
  });
}

function setStatus(state: DemoState, definition: DemoDefinition, entity: string, id: string, status: string): ReduceResult {
  const schema = schemaOf(state, definition, entity);
  const row = find(state, entity, id);
  if (!schema || !row) return missing(state);
  const statusDef = schema.fields.find((item) => item.key === 'status');
  if (statusDef?.options && !statusDef.options.some((option) => option.value === status)) {
    return fail(state, 'invalid', 'That status is not available.', 'Ese estado no está disponible.');
  }
  const next = notify(updateRow(state, entity, id, { status }), 'info', text('Status updated', 'Estado actualizado'), text(status, status));
  const events: DomainEvent[] = [{ type: 'record.status_changed', at: next.clock, payload: { entity, id, status } }];
  if (definition.id === 'ecommerce-orders' && status === 'packed') {
    events.push({
      type: 'fulfillment.packed',
      at: next.clock,
      payload: { sku: String(row.sku ?? ''), quantity: Number(row.quantity ?? 0) },
    });
  }
  if (definition.id === 'food-production' && status === 'hold') {
    events.push({
      type: 'lot.held',
      at: next.clock,
      payload: { sku: String(row.sku ?? ''), name: String(row.code ?? row.sku ?? id), quantity: Number(row.quantity ?? 0) },
    });
  }
  return { state: next, events };
}

function insert(state: DemoState, entity: string, data: Record<string, unknown>, title: { en: string; es: string }): ReduceResult {
  const seq = state.seq + 1;
  const row: EntityRecord = { ...data, id: `${entity}-${seq}`, createdAt: state.clock, updatedAt: state.clock };
  const next = notify(
    { ...state, seq, entities: { ...state.entities, [entity]: [...(state.entities[entity] ?? []), row] } },
    'info',
    title,
    text('Saved in this demonstration.', 'Guardado en esta demostración.'),
  );
  return ok(next);
}

function patchRecord(state: DemoState, entity: string, id: string, patch: Record<string, unknown>, title: { en: string; es: string }): ReduceResult {
  return ok(notify(updateRow(state, entity, id, patch), 'info', title, text('Saved in this demonstration.', 'Guardado en esta demostración.')));
}

function validate(schema: EntitySchema, data: Record<string, unknown>, partial: boolean): ActionError | undefined {
  for (const fieldDef of schema.fields) {
    if (fieldDef.form === false) continue;
    const present = Object.prototype.hasOwnProperty.call(data, fieldDef.key);
    if (!present) {
      if (!partial && fieldDef.required) {
        return error('required', `${fieldDef.label.en} is required.`, `${fieldDef.label.es} es obligatorio.`, fieldDef.key);
      }
      continue;
    }
    const value = data[fieldDef.key];
    const blank = value === '' || value === null || value === undefined;
    if (blank && fieldDef.required) {
      return error('required', `${fieldDef.label.en} is required.`, `${fieldDef.label.es} es obligatorio.`, fieldDef.key);
    }
    if (blank) continue;
    if ((fieldDef.type === 'number' || fieldDef.type === 'currency') && typeof value !== 'number') {
      return error('invalid', `${fieldDef.label.en} must be a number.`, `${fieldDef.label.es} debe ser un número.`, fieldDef.key);
    }
    if (typeof value === 'number' && fieldDef.min !== undefined && value < fieldDef.min) {
      return error('invalid', `${fieldDef.label.en} is too small.`, `${fieldDef.label.es} es demasiado pequeño.`, fieldDef.key);
    }
    if (typeof value === 'number' && fieldDef.max !== undefined && value > fieldDef.max) {
      return error('invalid', `${fieldDef.label.en} is too large.`, `${fieldDef.label.es} es demasiado grande.`, fieldDef.key);
    }
    if (fieldDef.options && !fieldDef.options.some((option) => option.value === value)) {
      return error('invalid', `${fieldDef.label.en} is not an accepted value.`, `${fieldDef.label.es} no es un valor aceptado.`, fieldDef.key);
    }
  }
  return undefined;
}

function pick(schema: EntitySchema, data: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const fieldDef of schema.fields) {
    if (fieldDef.form === false) continue;
    if (Object.prototype.hasOwnProperty.call(data, fieldDef.key)) picked[fieldDef.key] = data[fieldDef.key];
  }
  return picked;
}

function schemaOf(state: DemoState, definition: DemoDefinition, entity: string): EntitySchema | undefined {
  return schemasFor(definition, state.modules).find((schema) => schema.key === entity);
}

function find(state: DemoState, entity: string, id: string): EntityRecord | undefined {
  return (state.entities[entity] ?? []).find((row) => row.id === id);
}

function updateRow(state: DemoState, entity: string, id: string, patch: Record<string, unknown>): DemoState {
  return {
    ...state,
    entities: {
      ...state.entities,
      [entity]: (state.entities[entity] ?? []).map((row) =>
        row.id === id ? { ...row, ...patch, id: row.id, updatedAt: state.clock } : row,
      ),
    },
  };
}

function notify(state: DemoState, tone: 'info' | 'warning' | 'critical', title: { en: string; es: string }, body: { en: string; es: string }): DemoState {
  if (tone !== 'critical' && state.complexity === 'starter') return state;
  const seq = state.seq + 1;
  return {
    ...state,
    seq,
    notifications: [{ id: `note-${seq}`, tone, title, body, at: state.clock, read: false }, ...state.notifications].slice(0, 40),
  };
}

function withAudit(state: DemoState, action: DemoAction): DemoState {
  if (state.complexity !== 'enterprise') return state;
  const seq = state.seq + 1;
  return {
    ...state,
    seq,
    audit: [
      ...state.audit,
      { id: `audit-${seq}`, at: state.clock, action: actionName(action), summary: text(actionName(action), actionName(action)) },
    ],
  };
}

function permitted(state: DemoState, definition: DemoDefinition, action: DemoAction): boolean {
  if (state.complexity !== 'enterprise') return true;
  if (
    action.type === 'set_role' ||
    action.type === 'set_complexity' ||
    action.type === 'add_module' ||
    action.type === 'remove_module' ||
    action.type === 'mark_notifications_read'
  ) {
    return true;
  }
  const roles = definition.roles ?? [];
  if (roles.length === 0) return true;
  const role = roles.find((item) => item.id === state.simulatedRole) ?? roles[0];
  if (!role || role.allow.includes('*')) return true;
  return role.allow.includes(actionName(action));
}

function actionName(action: DemoAction): string {
  switch (action.type) {
    case 'create':
      return 'record.create';
    case 'update':
      return 'record.update';
    case 'remove':
      return 'record.delete';
    case 'set_status':
      return 'record.status';
    case 'special':
      return action.name;
    case 'cart_add':
    case 'cart_set_qty':
    case 'checkout':
      return action.type;
    default:
      return action.type;
  }
}

function shouldAudit(action: DemoAction): boolean {
  return action.type !== 'mark_notifications_read' && action.type !== 'set_role' && action.type !== 'set_complexity';
}

function ok(state: DemoState, events: DomainEvent[] = []): ReduceResult {
  return { state, events };
}

function fail(state: DemoState, code: string, en: string, es: string, field?: string): ReduceResult {
  return { state, events: [], error: error(code, en, es, field) };
}

function missing(state: DemoState): ReduceResult {
  return fail(state, 'not_found', 'That record is not in this demonstration.', 'Ese registro no está en esta demostración.');
}

function error(code: string, en: string, es: string, field?: string): ActionError {
  return { code, field, message: text(en, es) };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function modulesNeeded(definition: DemoDefinition, requested: readonly string[]) {
  return resolveModules(definition, requested);
}
