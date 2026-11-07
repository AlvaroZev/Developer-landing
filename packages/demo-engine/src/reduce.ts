import { clamp, rollupProjects, round } from "./seed";
import type {
  DemoAction,
  DemoError,
  DemoState,
  EntityDef,
  FieldDef,
  KnowledgeHit,
  Notice,
  ReduceResult,
  ResolvedDemo,
  Row,
} from "./types";

/**
 * All demonstration behavior goes through this reducer.
 * Screens dispatch actions. They do not invent totals, stock changes, or
 * alert rows on their own. Industry flavor (tax, currency) is read from the
 * resolved demo, not from a component.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initialState(demo: Pick<ResolvedDemo, "seeds">): DemoState {
  return {
    entities: structuredClone(demo.seeds),
    notices: [],
    seq: 1000,
    clock: "2026-03-18T15:00:00.000Z",
    ticks: 0,
    knowledge: [],
  };
}

export function reduceDemo(
  demo: ResolvedDemo,
  source: DemoState,
  action: DemoAction,
  flavorTax = demo.taxRate,
): ReduceResult {
  if (action.type === "reset") return ok(initialState(demo));
  const state = structuredClone(source);
  const failure = (error: DemoError): ReduceResult => ({ state: source, ok: false, error });

  if (action.type === "create" || action.type === "update") {
    const entity = entityDef(demo, action.entity);
    if (!entity) return failure({ code: "unknown_entity", message: "Unknown record type." });
    const current = action.type === "update" ? findRow(state, action.entity, action.id) : undefined;
    if (action.type === "update" && !current)
      return failure({ code: "missing", message: "Record was not found." });
    const draft =
      action.type === "update" ? { ...current, ...action.values } : { ...action.values };
    const cleaned = clean(entity, draft, state, action.type === "create");
    if (cleaned.error) return failure(cleaned.error);
    const overlap = calendarConflict(
      demo,
      state,
      action.entity,
      cleaned.row,
      action.type === "update" ? action.id : undefined,
    );
    if (overlap) return failure(overlap);
    if (action.type === "create") {
      cleaned.row.id = `${action.entity}-${state.seq}`;
      state.seq += 1;
      state.entities[action.entity]?.unshift(cleaned.row);
      applyDerived(demo, state, action.entity, cleaned.row);
      notice(state, "success", "Created", `${labelOf(cleaned.row)} added.`);
    } else if (current) {
      Object.assign(current, cleaned.row);
      applyDerived(demo, state, action.entity, current);
      notice(state, "info", "Updated", `${labelOf(current)} updated.`);
    }
    state.clock = bump(state.clock);
    return ok(state);
  }

  if (action.type === "delete") {
    const rows = state.entities[action.entity];
    if (!rows?.some((row) => row.id === action.id))
      return failure({ code: "missing", message: "Record was not found." });
    const used = referenced(demo, state, action.entity, action.id);
    if (used)
      return failure({ code: "in_use", message: "Another record still references this one." });
    state.entities[action.entity] = rows.filter((row) => row.id !== action.id);
    notice(state, "info", "Deleted", "Record removed.");
    return ok(state);
  }

  if (action.type === "transition") {
    const entity = entityDef(demo, action.entity);
    const row = findRow(state, action.entity, action.id);
    if (!entity?.statusKey || !entity.transitions || !row)
      return failure({ code: "missing", message: "Status cannot change." });
    const current = String(row[entity.statusKey] ?? "");
    const allowed = entity.transitions[current] ?? [];
    if (!allowed.includes(action.to))
      return failure({
        code: "invalid_transition",
        message: "That status change is not available.",
      });
    row[entity.statusKey] = action.to;
    afterTransition(demo, state, action.entity, row, action.to);
    notice(state, "success", "Status updated", `${labelOf(row)} is now ${action.to}.`);
    state.clock = bump(state.clock);
    return ok(state);
  }

  if (action.type === "simulate") return ok(simulate(demo, state, action.id));
  if (action.type === "control") {
    const row = findRow(state, action.entity, action.id);
    if (!row) return failure({ code: "missing", message: "Record was not found." });
    control(demo, state, action.entity, row, action.control, action.value);
    state.clock = bump(state.clock);
    return ok(state);
  }
  if (action.type === "compose-order") {
    const error = compose(demo, state, action.lines, flavorTax, action.customerId);
    if (error) return failure(error);
    return ok(state);
  }
  if (action.type === "query-knowledge") {
    state.knowledge = retrieve(demo, state, action.query);
    notice(
      state,
      state.knowledge.length ? "success" : "warning",
      "Retrieval",
      state.knowledge.length
        ? `${state.knowledge.length} passage(s) matched.`
        : "No passage matched those words.",
    );
    return ok(state);
  }
  if (action.type === "extract") {
    const spec = demo.blueprint.extract;
    const row = spec ? findRow(state, spec.entity, action.id) : undefined;
    if (!spec || !row) return failure({ code: "missing", message: "Document was not found." });
    const body = String(row[spec.bodyField] ?? "");
    row.extractedEmail = body.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
    row.extractedAmount = body.match(/(\d{2,6}\.\d{2})/)?.[1] ?? "";
    if (row.status === "inbox") row.status = "extracted";
    notice(state, "success", "Extracted", "Fields were read from the document text.");
    return ok(state);
  }
  return failure({ code: "unknown_action", message: "Unsupported action." });
}

function ok(state: DemoState): ReduceResult {
  return { state, ok: true };
}

function entityDef(demo: ResolvedDemo, key: string): EntityDef | undefined {
  return demo.entities.find((item) => item.key === key);
}

function findRow(state: DemoState, entity: string, id: string): Row | undefined {
  return state.entities[entity]?.find((row) => row.id === id);
}

function clean(
  entity: EntityDef,
  values: Record<string, unknown>,
  state: DemoState,
  creating: boolean,
): { row: Row; error?: DemoError } {
  const row: Row = { id: String(values.id ?? "") };
  for (const item of entity.fields) {
    if (item.readonly && !creating) {
      row[item.key] = values[item.key];
      continue;
    }
    const parsed = parseField(item, values[item.key], creating);
    if (parsed.error) return { row, error: parsed.error };
    if (parsed.skip) continue;
    if (item.type === "relation" && parsed.value) {
      const exists = state.entities[item.relation ?? ""]?.some(
        (candidate) => candidate.id === parsed.value,
      );
      if (!exists)
        return {
          row,
          error: { code: "relation", message: "Choose a related record.", field: item.key },
        };
    }
    row[item.key] = parsed.value;
  }
  if (
    creating &&
    entity.statusKey &&
    (row[entity.statusKey] === undefined || row[entity.statusKey] === "")
  ) {
    const first = entity.fields.find((item) => item.key === entity.statusKey)?.options?.[0]?.value;
    if (first) row[entity.statusKey] = first;
  }
  return { row };
}

function parseField(
  item: FieldDef,
  raw: unknown,
  creating: boolean,
): { value?: unknown; skip?: boolean; error?: DemoError } {
  const empty = raw === undefined || raw === null || raw === "";
  if (empty) {
    if (item.required && !item.readonly)
      return { error: { code: "required", message: "Required.", field: item.key } };
    if (!creating && item.readonly) return { skip: true };
    return {
      value: item.type === "number" || item.type === "money" || item.type === "percent" ? 0 : "",
    };
  }
  if (item.type === "number" || item.type === "money" || item.type === "percent") {
    const value = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(value))
      return { error: { code: "invalid", message: "Enter a number.", field: item.key } };
    if (item.min !== undefined && value < item.min)
      return { error: { code: "range", message: "Value is too low.", field: item.key } };
    if (item.max !== undefined && value > item.max)
      return { error: { code: "range", message: "Value is too high.", field: item.key } };
    return { value };
  }
  if (item.type === "boolean") return { value: raw === true || raw === "true" };
  if (item.type === "email" && !EMAIL.test(String(raw)))
    return { error: { code: "email", message: "Enter a valid email.", field: item.key } };
  if (
    (item.type === "date" || item.key === "start" || item.key === "end") &&
    item.type === "date" &&
    Number.isNaN(new Date(String(raw)).getTime())
  ) {
    return { error: { code: "date", message: "Enter a date.", field: item.key } };
  }
  if (
    (item.type === "select" || item.type === "status") &&
    !item.options?.some((option) => option.value === String(raw))
  ) {
    return {
      error: { code: "option", message: "Choose one of the listed values.", field: item.key },
    };
  }
  return { value: String(raw) };
}

function calendarConflict(
  demo: ResolvedDemo,
  state: DemoState,
  entityKey: string,
  row: Row,
  ignoreId?: string,
): DemoError | undefined {
  const calendar = demo.blueprint.calendar;
  if (!calendar || calendar.entity !== entityKey) return undefined;
  const start = String(row[calendar.startField] ?? "");
  const end = String(row[calendar.endField] ?? "");
  const resource = String(row[calendar.resourceField] ?? "");
  if (!start || !end || start >= end)
    return { code: "range", message: "End must be after start.", field: calendar.endField };
  const clash = (state.entities[entityKey] ?? []).some((other) => {
    if (other.id === ignoreId) return false;
    if (String(other[calendar.resourceField]) !== resource) return false;
    if (other.status === "cancelled") return false;
    const otherStart = String(other[calendar.startField] ?? "");
    const otherEnd = String(other[calendar.endField] ?? "");
    return start < otherEnd && end > otherStart;
  });
  if (!clash) return undefined;
  return {
    code: "conflict",
    message: "That time overlaps another booking for the same resource.",
    field: calendar.startField,
  };
}

function referenced(demo: ResolvedDemo, state: DemoState, entityKey: string, id: string): boolean {
  return demo.entities.some((entity) =>
    entity.fields.some(
      (item) =>
        item.type === "relation" &&
        item.relation === entityKey &&
        (state.entities[entity.key] ?? []).some((row) => row[item.key] === id),
    ),
  );
}

function applyDerived(demo: ResolvedDemo, state: DemoState, entityKey: string, row: Row): void {
  if (demo.solutionSlug === "product-catalogs" && entityKey === "products") {
    row.margin = round(Number(row.price ?? 0) - Number(row.cost ?? 0));
  }
  if (demo.solutionSlug === "production-planning" && entityKey === "materials") {
    row.status = Number(row.required) > Number(row.onHand) ? "short" : "covered";
  }
  if (demo.solutionSlug === "project-management" && entityKey === "tasks")
    rollupProjects(state.entities);
}

function afterTransition(
  demo: ResolvedDemo,
  state: DemoState,
  entityKey: string,
  row: Row,
  to: string,
): void {
  const slug = demo.solutionSlug;
  if (slug === "billing" && entityKey === "invoices" && to === "paid") {
    row.balance = 0;
    state.entities.payments?.unshift({
      id: `payments-${state.seq++}`,
      invoiceId: row.id,
      amount: row.amount,
      status: "settled",
    });
  }
  if (slug === "project-management" && entityKey === "tasks") rollupProjects(state.entities);
  if (slug === "inventory-management" && entityKey === "movements" && to === "posted") {
    const sku = findRow(state, "skus", String(row.skuId ?? ""));
    if (sku) {
      sku.onHand = Number(sku.onHand ?? 0) + Number(row.quantity ?? 0);
      sku.status = Number(sku.onHand) <= Number(sku.reorderAt) ? "reorder" : "ok";
    }
  }
  if (slug === "fleet-management" && entityKey === "trips") {
    const vehicle = findRow(state, "vehicles", String(row.vehicleId ?? ""));
    if (vehicle)
      vehicle.status = to === "enroute" ? "assigned" : to === "done" ? "available" : vehicle.status;
  }
  if (slug === "manufacturing-execution" && entityKey === "workOrders" && to === "done")
    row.good = row.quantity;
  if (slug === "maintenance-management" && entityKey === "workOrders" && to === "in_progress") {
    const asset = findRow(state, "assets", String(row.assetId ?? ""));
    if (asset) asset.status = "maintenance";
  }
  if (slug === "warehouse-management" && entityKey === "picks" && to === "picked") {
    const bin = (state.entities.inventory ?? []).find((item) => item.locationId === row.locationId);
    if (bin) bin.onHand = Math.max(0, Number(bin.onHand ?? 0) - Number(row.quantity ?? 0));
  }
  if (slug === "customer-management" && entityKey === "interactions" && to === "closed") {
    const customer = findRow(state, "customers", String(row.customerId ?? ""));
    if (customer) customer.points = Number(customer.points ?? 0) + 10;
  }
  if (slug === "quotation-systems" && entityKey === "quotes" && to === "accepted") {
    notice(state, "success", "Quote accepted", `${labelOf(row)} can become work.`);
  }
  if ((slug === "energy-monitoring" || slug === "industrial-iot") && to === "alert") {
    notice(state, "warning", "Threshold", `${labelOf(row)} crossed its threshold.`);
  }
}

function simulate(demo: ResolvedDemo, state: DemoState, onlyId?: string): DemoState {
  const hardware = demo.blueprint.hardware;
  state.ticks += 1;
  if (hardware) {
    const rows = (state.entities[hardware.deviceEntity] ?? []).filter(
      (row) => !onlyId || row.id === onlyId,
    );
    for (const row of rows) {
      const current = Number(row[hardware.readingField] ?? 0);
      const next = nextReading(current, state.ticks, row.id);
      const max = entityDef(demo, hardware.deviceEntity)?.fields.find(
        (item) => item.key === hardware.readingField,
      )?.max;
      row[hardware.readingField] = max !== undefined ? clamp(next, 0, max) : next;
      if (hardware.kind === "energy")
        row.energy = round(Number(row.energy ?? 0) + Number(row.power ?? 0) * 0.05);
      if (hardware.kind === "robotics" && row.state === "running") {
        row.x = clamp(Number(row.x ?? 0) + 3, 0, 100);
        row.heading = (Number(row.heading ?? 0) + 15) % 360;
      }
      const threshold = hardware.thresholdField ? Number(row[hardware.thresholdField]) : undefined;
      if (threshold !== undefined && Number(row[hardware.readingField]) >= threshold) {
        if (hasOption(demo, hardware.deviceEntity, "status", "alert")) row.status = "alert";
        pushAlert(demo, state, row.id, `${labelOf(row)} crossed ${threshold}.`);
      }
      pushSample(demo, state, row.id, Number(row[hardware.readingField]));
    }
  }
  if (demo.solutionSlug === "smart-agriculture") {
    for (const zone of state.entities.zones ?? []) {
      zone.moisture = clamp(nextReading(Number(zone.moisture ?? 0), state.ticks, zone.id), 0, 100);
      if (zone.mode === "auto" && Number(zone.moisture) < Number(zone.threshold)) {
        zone.valve = "open";
        zone.status = "watering";
        state.entities.events?.unshift({
          id: `events-${state.seq++}`,
          zoneId: zone.id,
          message: `${labelOf(zone)} opened because moisture is below the threshold.`,
          status: "open",
        });
        notice(state, "warning", "Irrigation", `${labelOf(zone)} valve opened.`);
      }
    }
  }
  if (demo.solutionSlug === "control-systems") {
    for (const loop of state.entities.loops ?? []) {
      if (loop.interlock === true || loop.status === "tripped") continue;
      const current = Number(loop.processValue ?? 0);
      const target = Number(loop.setpoint ?? current);
      loop.processValue = round(current + (target - current) * 0.25);
      state.entities.trends?.unshift({
        id: `trends-${state.seq++}`,
        loopId: loop.id,
        value: loop.processValue,
        takenAt: state.clock,
      });
    }
  }
  state.clock = bump(state.clock);
  return state;
}

function control(
  demo: ResolvedDemo,
  state: DemoState,
  entityKey: string,
  row: Row,
  command: string,
  value: unknown,
): void {
  if (command === "estop") {
    row.speed = 0;
    row.output = 0;
    if ("state" in row) row.state = "estop";
    if (demo.solutionSlug === "control-systems") {
      row.interlock = true;
      row.status = "tripped";
      for (const lock of state.entities.interlocks ?? []) {
        if (lock.loopId === row.id) lock.status = "tripped";
      }
    }
    if (demo.solutionSlug === "industrial-automation") row.status = "alert";
    for (const mission of state.entities.missions ?? []) {
      if (mission.robotId === row.id && mission.status === "running") mission.status = "stopped";
    }
    notice(
      state,
      "warning",
      "Emergency stop",
      `${labelOf(row)} output is zero. This is a simulation.`,
    );
    return;
  }
  if (command === "resume") {
    if (row.state === "estop") row.state = "idle";
    if (row.status === "tripped") row.status = "manual";
    if (row.status === "alert" && demo.solutionSlug === "industrial-automation")
      row.status = "stopped";
    row.interlock = false;
    notice(state, "info", "Resume", `${labelOf(row)} can be started again.`);
    return;
  }
  if (command === "valve") {
    row.valve = value === "open" ? "open" : "closed";
    row.status = row.valve === "open" ? "watering" : "idle";
    notice(state, "info", "Valve", `${labelOf(row)} is ${row.valve}.`);
    return;
  }
  if (command === "score" && demo.solutionSlug === "predictive-analytics") {
    row.score = round(clamp(Number(row.usage ?? 0) * 0.4 + Number(row.failures ?? 0) * 12, 0, 100));
    row.status = Number(row.score) >= 70 ? "risk" : Number(row.score) >= 40 ? "watching" : "clear";
    if (row.status === "risk")
      pushAlert(demo, state, row.id, `${labelOf(row)} scored ${row.score}.`);
    return;
  }
  if (command === "score" && demo.solutionSlug === "decision-support") {
    for (const option of state.entities.options ?? []) {
      if (option.caseId === row.id)
        option.score = Number(option.impact ?? 0) * 2 - Number(option.effort ?? 0);
    }
    notice(state, "success", "Scored", "Options were scored from impact and effort.");
    return;
  }
  if (command === "sync") {
    row.reported = row.shadow;
    row.status = "in_sync";
    state.entities.syncs?.unshift({
      id: `syncs-${state.seq++}`,
      deviceId: row.id,
      result: "Shadow matches the device.",
      status: "ok",
    });
    notice(state, "success", "Synced", `${labelOf(row)} reported state matches the desired state.`);
    return;
  }
  if (command === "diagnose") {
    const pass = Number(row.heap ?? 0) < Number(row.threshold ?? 100);
    state.entities.diagnostics?.unshift({
      id: `diagnostics-${state.seq++}`,
      deviceId: row.id,
      result: pass ? "Diagnostics passed." : "Heap is above the threshold.",
      status: pass ? "pass" : "fail",
    });
    notice(
      state,
      pass ? "success" : "warning",
      "Diagnostics",
      pass ? "Board checks passed." : "Diagnostics reported a fault.",
    );
    return;
  }
  if (command === "advance" && entityKey === "campaigns") {
    row.progress = clamp(Number(row.progress ?? 0) + 15, 0, 100);
    row.status = Number(row.progress) >= 100 ? "done" : "rolling";
    notice(state, "info", "Campaign", `${labelOf(row)} is at ${row.progress}%.`);
  }
}

function compose(
  demo: ResolvedDemo,
  state: DemoState,
  lines: { productId: string; qty: number }[],
  taxRate: number,
  customerId?: string,
): DemoError | undefined {
  const order = demo.blueprint.order;
  if (!order) return { code: "unsupported", message: "This demonstration does not take orders." };
  if (!lines.length) return { code: "required", message: "Add at least one line.", field: "lines" };
  let subtotal = 0;
  const summary: string[] = [];
  for (const line of lines) {
    if (!Number.isInteger(line.qty) || line.qty < 1)
      return { code: "range", message: "Quantity must be at least 1.", field: "qty" };
    const product = findRow(state, order.productEntity, line.productId);
    if (!product) return { code: "missing", message: "Item was not found.", field: "productId" };
    if (Number(product[order.stockField] ?? 0) < line.qty)
      return { code: "stock", message: "Not enough stock for that quantity.", field: "qty" };
    subtotal += Number(product[order.priceField] ?? 0) * line.qty;
    summary.push(`${line.qty} × ${labelOf(product)}`);
  }
  for (const line of lines) {
    const product = findRow(state, order.productEntity, line.productId);
    if (product) product[order.stockField] = Number(product[order.stockField] ?? 0) - line.qty;
  }
  const tax = round(subtotal * taxRate);
  const total = round(subtotal + tax);
  const status =
    entityDef(demo, order.orderEntity)?.fields.find((item) => item.type === "status")?.options?.[0]
      ?.value ?? "placed";
  const row: Row = {
    id: `${order.orderEntity}-${state.seq++}`,
    number: `SO-${state.seq}`,
    subtotal: round(subtotal),
    tax,
    total,
    summary: summary.join(", "),
    status,
  };
  if (customerId) row.customerId = customerId;
  const firstProduct = findRow(state, order.productEntity, lines[0]?.productId ?? "");
  if (firstProduct?.sellerId) row.listingId = firstProduct.id;
  state.entities[order.orderEntity]?.unshift(row);
  if (demo.solutionSlug === "marketplaces" && firstProduct?.sellerId) {
    const seller = findRow(state, "sellers", String(firstProduct.sellerId));
    const fee = Number(seller?.feeRate ?? 0.1);
    state.entities.payouts?.unshift({
      id: `payouts-${state.seq++}`,
      sellerId: firstProduct.sellerId,
      amount: round(total * (1 - fee)),
      status: "pending",
    });
  }
  notice(state, "success", "Order created", `${row.number} totals ${total}.`);
  state.clock = bump(state.clock);
  return undefined;
}

function retrieve(demo: ResolvedDemo, state: DemoState, query: string): KnowledgeHit[] {
  const spec = demo.blueprint.knowledge;
  if (!spec) return [];
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);
  return (state.entities[spec.entity] ?? [])
    .map((row) => {
      const title = String(row[spec.titleField] ?? "");
      const body = String(row[spec.bodyField] ?? "");
      const haystack = `${title} ${body}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { id: row.id, title, excerpt: body.slice(0, 180), score };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function pushAlert(demo: ResolvedDemo, state: DemoState, sourceId: string, message: string): void {
  const alerts = demo.entities.find((item) => item.key === "alerts");
  if (!alerts) {
    notice(state, "warning", "Alert", message);
    return;
  }
  const link = alerts.fields.find((item) => item.type === "relation");
  const row: Row = { id: `alerts-${state.seq++}`, message, status: "open" };
  if (link) row[link.key] = sourceId;
  state.entities.alerts?.unshift(row);
  notice(state, "warning", "Alert", message);
}

function pushSample(demo: ResolvedDemo, state: DemoState, sourceId: string, value: number): void {
  const readings = demo.entities.find((item) => item.key === "readings" || item.key === "samples");
  if (!readings) return;
  const link = readings.fields.find((item) => item.type === "relation");
  const row: Row = { id: `${readings.key}-${state.seq++}`, value, takenAt: state.clock };
  if (readings.key === "readings" && readings.fields.some((item) => item.key === "power")) {
    row.power = value;
    row.energy = value;
  }
  if (link) row[link.key] = sourceId;
  state.entities[readings.key]?.unshift(row);
  const list = state.entities[readings.key];
  if (list && list.length > 40) list.length = 40;
}

function nextReading(current: number, tick: number, id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 33 + char.charCodeAt(0)) % 997;
  let delta = ((hash + tick * 17) % 11) - 5;
  if (delta === 0) delta = 1;
  return round(current + delta);
}

function hasOption(
  demo: ResolvedDemo,
  entityKey: string,
  fieldKey: string,
  value: string,
): boolean {
  return Boolean(
    entityDef(demo, entityKey)
      ?.fields.find((item) => item.key === fieldKey)
      ?.options?.some((option) => option.value === value),
  );
}

function notice(state: DemoState, tone: Notice["tone"], title: string, body: string): void {
  state.notices.unshift({ id: `notice-${state.seq++}`, tone, title, body });
  if (state.notices.length > 30) state.notices.length = 30;
}

function labelOf(row: Row): string {
  for (const key of [
    "name",
    "title",
    "fullName",
    "number",
    "sku",
    "unit",
    "reference",
    "subject",
  ]) {
    if (typeof row[key] === "string" && row[key]) return String(row[key]);
  }
  return row.id;
}

function bump(clock: string): string {
  const date = new Date(clock);
  date.setUTCMinutes(date.getUTCMinutes() + 1);
  return date.toISOString();
}

export function labelForRow(row: Row): string {
  return labelOf(row);
}
