import type { DemoState, DomainEvent, EntityRecord } from '@triunder/domain';

/**
 * Cross-module reactions. Handlers emit events; they do not reach into
 * another module's tables. Add a reaction here when a module declares a
 * new `listens` entry, and cover it with a test.
 *
 * The pass limit stops a faulty new effect from looping forever.
 */
export function applyEffects(state: DemoState, events: readonly DomainEvent[]): DemoState {
  let current = state;
  let pending = [...events];
  for (let pass = 0; pass < 4 && pending.length > 0; pass += 1) {
    const produced: DomainEvent[] = [];
    for (const event of pending) {
      const result = react(current, event);
      current = result.state;
      produced.push(...result.events);
    }
    pending = produced;
  }
  return current;
}

function react(state: DemoState, event: DomainEvent): { state: DemoState; events: DomainEvent[] } {
  switch (event.type) {
    case 'commerce.order.placed':
      return placeOrder(state, event);
    case 'mes.work_order.released':
      return consumeMaterial(state, event);
    case 'iot.threshold.breached':
      return openMaintenance(state, event);
    case 'logistics.shipment.delivered':
      return deliverOrder(state, event);
    case 'booking.confirmed':
      return recordDeposit(state, event);
    case 'lot.held':
      return holdLot(state, event);
    case 'fulfillment.packed':
      return packStock(state, event);
    default:
      return { state, events: [] };
  }
}

function placeOrder(state: DemoState, event: DomainEvent): { state: DemoState; events: DomainEvent[] } {
  let next = state;
  const events: DomainEvent[] = [];
  if (next.modules.includes('inventory')) {
    const lines = Array.isArray(event.payload.lines) ? event.payload.lines : [];
    for (const line of lines) {
      if (!line || typeof line !== 'object') continue;
      const sku = String((line as { sku?: unknown }).sku ?? '');
      const quantity = Number((line as { quantity?: unknown }).quantity ?? 0);
      if (!sku || quantity <= 0) continue;
      const adjusted = adjustStock(next, sku, quantity, 'order');
      next = adjusted.state;
      if (adjusted.changed) {
        events.push({ type: 'inventory.adjusted', at: next.clock, payload: { sku, quantity } });
      }
    }
  }
  if (next.modules.includes('payments')) {
    const amount = Number(event.payload.totalCents ?? 0);
    if (amount > 0) next = addPayment(next, String(event.payload.reference ?? 'order'), amount);
  }
  return { state: next, events };
}

function consumeMaterial(state: DemoState, event: DomainEvent): { state: DemoState; events: DomainEvent[] } {
  if (!state.modules.includes('inventory')) return { state, events: [] };
  const sku = String(event.payload.sku ?? '');
  const quantity = Number(event.payload.quantity ?? 0);
  const adjusted = adjustStock(state, sku, quantity, 'work order');
  return {
    state: adjusted.state,
    events: adjusted.changed
      ? [{ type: 'inventory.adjusted', at: adjusted.state.clock, payload: { sku, quantity } }]
      : [],
  };
}

function packStock(state: DemoState, event: DomainEvent): { state: DemoState; events: DomainEvent[] } {
  if (!state.modules.includes('inventory')) return { state, events: [] };
  const adjusted = adjustStock(state, String(event.payload.sku ?? ''), Number(event.payload.quantity ?? 0), 'packed');
  return { state: adjusted.state, events: [] };
}

function holdLot(state: DemoState, event: DomainEvent): { state: DemoState; events: DomainEvent[] } {
  if (!state.modules.includes('inventory')) return { state, events: [] };
  const sku = String(event.payload.sku ?? '');
  if (!sku) return { state, events: [] };
  const existing = (state.entities.stock_items ?? []).find((item) => item.sku === sku);
  if (existing) {
    return { state: updateRow(state, 'stock_items', existing.id, { status: 'held' }), events: [] };
  }
  const seq = state.seq + 1;
  const row: EntityRecord = {
    id: `stk-${seq}`,
    sku,
    name: String(event.payload.name ?? sku),
    onHand: Number(event.payload.quantity ?? 0),
    status: 'held',
    createdAt: state.clock,
    updatedAt: state.clock,
  };
  return {
    state: {
      ...state,
      seq,
      entities: { ...state.entities, stock_items: [...(state.entities.stock_items ?? []), row] },
    },
    events: [],
  };
}

function openMaintenance(state: DemoState, event: DomainEvent): { state: DemoState; events: DomainEvent[] } {
  if (!state.modules.includes('maintenance')) return { state, events: [] };
  const seq = state.seq + 1;
  const asset = String(event.payload.asset ?? 'Device');
  const row: EntityRecord = {
    id: `mnt-${seq}`,
    title: `Inspect ${asset}`,
    source: 'threshold',
    asset,
    status: 'open',
    createdAt: state.clock,
    updatedAt: state.clock,
  };
  const next: DemoState = {
    ...state,
    seq,
    entities: {
      ...state.entities,
      maintenance_tasks: [...(state.entities.maintenance_tasks ?? []), row],
    },
  };
  return {
    state: next,
    events: [{ type: 'maintenance.task.opened', at: next.clock, payload: { id: row.id, asset } }],
  };
}

function deliverOrder(state: DemoState, event: DomainEvent): { state: DemoState; events: DomainEvent[] } {
  const reference = String(event.payload.orderRef ?? '');
  if (!reference) return { state, events: [] };
  const order = (state.entities.orders ?? []).find((row) => row.reference === reference);
  if (!order) return { state, events: [] };
  return { state: updateRow(state, 'orders', order.id, { status: 'delivered' }), events: [] };
}

function recordDeposit(state: DemoState, event: DomainEvent): { state: DemoState; events: DomainEvent[] } {
  if (!state.modules.includes('payments')) return { state, events: [] };
  const amount = Number(event.payload.depositCents ?? 0);
  if (amount <= 0) return { state, events: [] };
  return { state: addPayment(state, String(event.payload.reference ?? 'booking'), amount), events: [] };
}

function adjustStock(
  state: DemoState,
  sku: string,
  quantity: number,
  reason: string,
): { state: DemoState; changed: boolean } {
  if (!sku || quantity <= 0) return { state, changed: false };
  const item = (state.entities.stock_items ?? []).find((row) => row.sku === sku);
  if (!item) return { state, changed: false };
  const onHand = Number(item.onHand ?? 0) - quantity;
  if (onHand < 0) return { state, changed: false };
  const seq = state.seq + 1;
  const withItem = updateRow({ ...state, seq }, 'stock_items', item.id, { onHand });
  const move: EntityRecord = {
    id: `move-${seq}`,
    sku,
    quantity: -quantity,
    reason,
    createdAt: state.clock,
    updatedAt: state.clock,
  };
  return {
    changed: true,
    state: {
      ...withItem,
      entities: { ...withItem.entities, stock_moves: [...(withItem.entities.stock_moves ?? []), move] },
    },
  };
}

function addPayment(state: DemoState, reference: string, amountCents: number): DemoState {
  const seq = state.seq + 1;
  const row: EntityRecord = {
    id: `pay-${seq}`,
    reference,
    amountCents,
    state: 'simulated',
    createdAt: state.clock,
    updatedAt: state.clock,
  };
  return {
    ...state,
    seq,
    entities: { ...state.entities, payment_records: [...(state.entities.payment_records ?? []), row] },
  };
}

function updateRow(state: DemoState, key: string, id: string, patch: Record<string, unknown>): DemoState {
  const rows = state.entities[key] ?? [];
  return {
    ...state,
    entities: {
      ...state.entities,
      [key]: rows.map((row) => (row.id === id ? { ...row, ...patch, id: row.id, updatedAt: state.clock } : row)),
    },
  };
}
