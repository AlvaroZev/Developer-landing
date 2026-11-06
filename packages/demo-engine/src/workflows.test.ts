import { describe, expect, it } from 'vitest';
import type { EntitySchema } from '@triunder/domain';
import { applyAction, cartTotalCents, createSession, nextFieldReading, queryRecords } from './index';

function session(industry: string, solution: string, complexity: 'starter' | 'professional' | 'enterprise' = 'professional', modules: string[] = []) {
  const built = createSession(industry, solution, complexity, modules);
  if (!built.state) throw new Error(`missing ${industry}/${solution}`);
  return built.state;
}

describe('flagship workflows', () => {
  it('creates, updates, and validates healthcare appointments', () => {
    let state = session('healthcare', 'crm');
    const bad = applyAction(state, { type: 'special', name: 'appointment.create', payload: { patientId: 'missing', professionalId: 'pro-leona', start: '2026-04-21', reason: 'X' } });
    expect(bad.error?.code).toBe('missing_relation');
    const created = applyAction(state, { type: 'special', name: 'appointment.create', payload: { patientId: 'pat-inez', professionalId: 'pro-carla', start: '2026-04-21T11:00:00.000Z', reason: 'Follow-up visit' } });
    expect(created.error).toBeUndefined();
    const id = created.state.entities.appointments?.at(-1)?.id as string;
    state = applyAction(created.state, { type: 'special', name: 'appointment.update', payload: { id, status: 'confirmed' } }).state;
    expect(state.entities.appointments?.find((row) => row.id === id)?.status).toBe('confirmed');
    const follow = applyAction(state, { type: 'special', name: 'followup.add', payload: { patientId: 'pat-inez', note: 'Bring the log', due: '2026-04-28' } });
    expect(follow.state.entities.followups?.some((row) => row.note === 'Bring the log')).toBe(true);
    const invalid = applyAction(state, { type: 'create', entity: 'patients', data: { mrn: 'HL-1' } });
    expect(invalid.error?.code).toBe('required');
  });

  it('checks out a retail cart and posts inventory and a simulated payment', () => {
    let state = session('retail', 'ecommerce', 'professional', ['inventory', 'payments']);
    const notebook = 'prd-note';
    state = applyAction(state, { type: 'cart_add', productId: notebook, quantity: 2 }).state;
    expect(cartTotalCents(state)).toBe(3600);
    const tooMany = applyAction(state, { type: 'cart_set_qty', productId: notebook, quantity: 99 });
    expect(tooMany.error?.code).toBe('stock');
    const empty = applyAction(session('retail', 'ecommerce'), { type: 'checkout', customerName: 'Nia' });
    expect(empty.error?.code).toBe('empty_cart');
    const bought = applyAction(state, { type: 'checkout', customerName: 'Nia Pell' });
    expect(bought.error).toBeUndefined();
    expect(bought.state.cart).toEqual([]);
    expect(bought.state.entities.products?.find((row) => row.id === notebook)?.stock).toBe(16);
    expect(bought.state.entities.stock_items?.find((row) => row.sku === 'NT-1')?.onHand).toBe(16);
    expect(bought.state.entities.stock_moves?.length).toBeGreaterThan(0);
    expect(bought.state.entities.payment_records?.length).toBe(1);
    expect(bought.state.entities.payment_records?.[0]?.state).toBe('simulated');
  });

  it('releases manufacturing work, blocks on material, records downtime, and stops a robot', () => {
    let state = session('manufacturing', 'mes', 'professional', ['inventory', 'robotics-cell']);
    const released = applyAction(state, { type: 'special', name: 'workorder.release', payload: { id: 'wo-104' } });
    expect(released.state.entities.work_orders?.find((row) => row.id === 'wo-104')?.status).toBe('released');
    expect(released.state.entities.stock_items?.find((row) => row.sku === 'STL-1')?.onHand).toBe(36);
    state = released.state;
    const created = applyAction(state, {
      type: 'create',
      entity: 'work_orders',
      data: { number: 'WO-200', product: 'Pin', quantity: 1, materialSku: 'FST-4', materialQty: 500, status: 'draft' },
    });
    const blocked = applyAction(created.state, { type: 'special', name: 'workorder.release', payload: { id: created.state.entities.work_orders?.at(-1)?.id } });
    expect(blocked.error?.code).toBe('stock');
    const down = applyAction(state, { type: 'special', name: 'workorder.downtime', payload: { id: 'wo-105', minutes: 15, reason: 'Guard open' } });
    expect(down.state.entities.work_orders?.find((row) => row.id === 'wo-105')?.status).toBe('blocked');
    expect(down.state.entities.downtime?.some((row) => row.reason === 'Guard open')).toBe(true);
    const jog = applyAction(state, { type: 'special', name: 'robot.jog', payload: { id: 'robot-1', axis: 'x', delta: 90 } });
    expect(jog.error?.code).toBe('invalid');
    const moved = applyAction(state, { type: 'special', name: 'robot.jog', payload: { id: 'robot-1', axis: 'x', delta: 20 } });
    expect(moved.state.entities.robots?.find((row) => row.id === 'robot-1')?.x).toBe(40);
    const stopped = applyAction(moved.state, { type: 'special', name: 'robot.estop', payload: { id: 'robot-1' } });
    const denied = applyAction(stopped.state, { type: 'special', name: 'robot.jog', payload: { id: 'robot-1', axis: 'y', delta: 10 } });
    expect(denied.error?.code).toBe('estop');
    const reset = applyAction(stopped.state, { type: 'special', name: 'robot.reset', payload: { id: 'robot-1' } });
    expect(reset.state.entities.robots?.[0]?.state).toBe('idle');

    let enterprise = session('manufacturing', 'mes', 'enterprise');
    enterprise = applyAction(enterprise, { type: 'set_role', roleId: 'operator' }).state;
    const forbidden = applyAction(enterprise, { type: 'special', name: 'workorder.release', payload: { id: 'wo-104' } });
    expect(forbidden.error?.code).toBe('forbidden_in_simulated_role');
    const submitted = applyAction(enterprise, { type: 'special', name: 'workorder.submit', payload: { id: 'wo-104' } });
    expect(submitted.state.entities.work_orders?.find((row) => row.id === 'wo-104')?.status).toBe('awaiting_release');
  });

  it('assigns a shipment and marks the linked order delivered', () => {
    let state = session('logistics', 'fleet');
    state = applyAction(state, { type: 'special', name: 'shipment.assign', payload: { shipmentId: 'shp-1', vehicleId: 'veh-1', driverId: 'drv-ada' } }).state;
    expect(state.entities.vehicles?.find((row) => row.id === 'veh-1')?.status).toBe('assigned');
    const again = applyAction(state, { type: 'special', name: 'shipment.assign', payload: { shipmentId: 'shp-1', vehicleId: 'veh-2', driverId: 'drv-leo' } });
    expect(again.error?.code).toBe('invalid_transition');
    state = applyAction(state, { type: 'special', name: 'shipment.deliver', payload: { shipmentId: 'shp-1' } }).state;
    expect(state.entities.shipments?.find((row) => row.id === 'shp-1')?.status).toBe('delivered');
    expect(state.entities.vehicles?.find((row) => row.id === 'veh-1')?.status).toBe('available');
    expect(state.entities.orders?.find((row) => row.reference === 'HL-440')?.status).toBe('delivered');
  });

  it('moves a real-estate lead through a viewing into an offer', () => {
    let state = session('real-estate', 'crm');
    state = applyAction(state, { type: 'special', name: 'lead.create', payload: { name: 'Vera Lin', interest: 'Kiln house' } }).state;
    const leadId = state.entities.leads?.at(-1)?.id as string;
    state = applyAction(state, { type: 'special', name: 'viewing.schedule', payload: { leadId, propertyId: 'prop-kiln', agentId: 'agt-sam', start: '2026-04-18T15:00:00.000Z' } }).state;
    expect(state.entities.leads?.find((row) => row.id === leadId)?.status).toBe('viewing');
    state = applyAction(state, { type: 'special', name: 'deal.stage', payload: { leadId, stage: 'offer' } }).state;
    expect(state.entities.properties?.find((row) => row.id === 'prop-kiln')?.status).toBe('under_offer');
  });

  it('samples agriculture telemetry, alerts, irrigates, and opens maintenance', () => {
    expect(nextFieldReading({ moisture: 40, tempC: 20, humidity: 60, irrigation: 'off' }).moisture).toBe(34);
    let state = session('agriculture', 'iot', 'starter', ['maintenance', 'iot-monitoring']);
    const offline = applyAction(state, { type: 'special', name: 'telemetry.sample', payload: { deviceId: 'dev-c' } });
    expect(offline.error?.code).toBe('offline');
    const sampled = applyAction(state, { type: 'special', name: 'telemetry.sample', payload: { deviceId: 'dev-a' } });
    expect(sampled.state.entities.devices?.find((row) => row.id === 'dev-a')?.moisture).toBe(34);
    expect(sampled.state.notifications.some((note) => note.tone === 'critical')).toBe(true);
    expect(sampled.state.entities.maintenance_tasks?.some((row) => row.source === 'threshold')).toBe(true);
    state = applyAction(sampled.state, { type: 'special', name: 'irrigation.set', payload: { id: 'dev-a', running: true } }).state;
    expect(state.entities.devices?.find((row) => row.id === 'dev-a')?.irrigation).toBe('running');
    const threshold = applyAction(state, { type: 'special', name: 'threshold.set', payload: { id: 'dev-a', moisture: 140 } });
    expect(threshold.error?.code).toBe('invalid');
  });
});

describe('registry workflows and modules', () => {
  it('confirms a booking once and records a simulated deposit', () => {
    let state = session('hospitality', 'booking', 'professional', ['payments']);
    state = applyAction(state, { type: 'special', name: 'booking.confirm', payload: { id: 'svc-1' } }).state;
    expect(state.entities.services?.find((row) => row.id === 'svc-1')?.remaining).toBe(3);
    expect(state.entities.payment_records?.[0]?.amountCents).toBe(2500);
    const full = applyAction(state, { type: 'special', name: 'booking.confirm', payload: { id: 'svc-2' } });
    expect(full.error?.code).toBe('capacity');
  });

  it('crosses an energy threshold and opens maintenance', () => {
    let state = session('energy', 'energy-monitoring', 'professional', ['maintenance']);
    state = applyAction(state, { type: 'special', name: 'reading.sample', payload: { id: 'mt-1' } }).state;
    expect(state.entities.meters?.find((row) => row.id === 'mt-1')?.status).toBe('alarm');
    expect(state.entities.maintenance_tasks?.some((row) => String(row.asset).includes('Feeder'))).toBe(true);
  });

  it('holds a food lot in the inventory ledger and packs an online order', () => {
    let food = session('food-production', 'production-planning', 'professional', ['inventory']);
    food = applyAction(food, { type: 'set_status', entity: 'lots', id: 'lot-18', status: 'hold' }).state;
    expect(food.entities.stock_items?.find((row) => row.sku === 'LOT-18')?.status).toBe('held');

    let shop = session('ecommerce', 'orders', 'professional', ['inventory']);
    const before = Number(shop.entities.stock_items?.find((row) => row.sku === 'NT-1')?.onHand);
    shop = applyAction(shop, { type: 'set_status', entity: 'orders', id: 'eo-1', status: 'packed' }).state;
    expect(Number(shop.entities.stock_items?.find((row) => row.sku === 'NT-1')?.onHand)).toBe(before - 2);
  });

  it('refuses a dependent module removal and an incompatible module', () => {
    let state = session('agriculture', 'iot', 'professional', ['embedded-diagnostics']);
    expect(state.modules).toEqual(['iot-monitoring', 'embedded-diagnostics']);
    const blocked = applyAction(state, { type: 'remove_module', moduleId: 'iot-monitoring' });
    expect(blocked.error?.code).toBe('module_dependents');
    state = applyAction(state, { type: 'remove_module', moduleId: 'iot-monitoring', force: true }).state;
    expect(state.modules).not.toContain('embedded-diagnostics');
    const retail = session('retail', 'ecommerce');
    const rejected = applyAction(retail, { type: 'add_module', moduleId: 'robotics-cell' });
    expect(rejected.error?.code).toBe('module_rejected');
  });

  it('filters and sorts records', () => {
    const state = session('manufacturing', 'mes');
    const schema: EntitySchema = {
      key: 'work_orders',
      singular: { en: 'Work order', es: 'Orden' },
      plural: { en: 'Work orders', es: 'Órdenes' },
      primary: 'number',
      search: ['number', 'product'],
      fields: [],
    };
    const found = queryRecords(state.entities.work_orders ?? [], schema, { text: 'bracket', sort: 'number', direction: 'asc' });
    expect(found).toHaveLength(1);
  });
});
