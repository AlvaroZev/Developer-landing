import { initialState, reduceDemo } from "./reduce";
import type { DemoAction, DemoState, ResolvedDemo } from "./types";

/**
 * The catalog test runs this against every compatible pair. Each plan has to
 * change state through the reducer, or fail in a way the plan expected.
 */
export function exerciseDemo(demo: ResolvedDemo): { ok: boolean; reason?: string } {
  let state = initialState(demo);
  const steps = plan(demo, state);
  if (!steps.length) return { ok: false, reason: "no steps" };
  let changed = false;
  for (const step of steps) {
    const before = JSON.stringify(state);
    const result = reduceDemo(demo, state, step.action);
    if (step.expect === "error") {
      if (result.ok) return { ok: false, reason: "expected an error" };
      continue;
    }
    if (!result.ok)
      return { ok: false, reason: `${step.action.type}:${result.error?.code ?? "error"}` };
    state = result.state;
    if (JSON.stringify(state) !== before) changed = true;
  }
  return changed ? { ok: true } : { ok: false, reason: "state did not change" };
}

function plan(
  demo: ResolvedDemo,
  state: DemoState,
): { action: DemoAction; expect: "ok" | "error" }[] {
  const calendar = demo.blueprint.calendar;
  if (calendar) {
    const sample = state.entities[calendar.entity]?.[0];
    if (!sample) return [];
    const { id: _id, ...rest } = sample;
    return [
      { action: { type: "create", entity: calendar.entity, values: rest }, expect: "error" },
      {
        action: {
          type: "create",
          entity: calendar.entity,
          values: { ...rest, start: "2026-04-02T09:00:00.000Z", end: "2026-04-02T10:00:00.000Z" },
        },
        expect: "ok",
      },
    ];
  }
  if (demo.blueprint.hardware?.estop) {
    const entity = demo.blueprint.hardware.deviceEntity;
    const id = state.entities[entity]?.[0]?.id;
    return id ? [{ action: { type: "control", entity, id, control: "estop" }, expect: "ok" }] : [];
  }
  if (demo.blueprint.knowledge)
    return [{ action: { type: "query-knowledge", query: "contact amount" }, expect: "ok" }];
  if (demo.blueprint.extract) {
    const id = state.entities[demo.blueprint.extract.entity]?.[0]?.id;
    return id ? [{ action: { type: "extract", id }, expect: "ok" }] : [];
  }
  if (demo.blueprint.order) {
    const id = state.entities[demo.blueprint.order.productEntity]?.[0]?.id;
    return id
      ? [{ action: { type: "compose-order", lines: [{ productId: id, qty: 1 }] }, expect: "ok" }]
      : [];
  }
  if (demo.solutionSlug === "predictive-analytics") {
    const id = state.entities.cases?.[0]?.id;
    return id
      ? [{ action: { type: "control", entity: "cases", id, control: "score" }, expect: "ok" }]
      : [];
  }
  if (demo.solutionSlug === "decision-support") {
    const id = state.entities.cases?.[0]?.id;
    return id
      ? [{ action: { type: "control", entity: "cases", id, control: "score" }, expect: "ok" }]
      : [];
  }
  if (demo.solutionSlug === "hardware-software-integration") {
    const id = state.entities.devices?.[0]?.id;
    return id
      ? [{ action: { type: "control", entity: "devices", id, control: "sync" }, expect: "ok" }]
      : [];
  }
  if (demo.blueprint.hardware) return [{ action: { type: "simulate" }, expect: "ok" }];
  const transition = firstTransition(demo, state);
  if (transition) return [{ action: transition, expect: "ok" }];
  const entity = demo.entities[0];
  const row = entity ? state.entities[entity.key]?.[0] : undefined;
  const field = entity?.fields.find((item) => item.type === "text" && !item.readonly);
  if (!entity || !row || !field) return [];
  return [
    {
      action: {
        type: "update",
        entity: entity.key,
        id: row.id,
        values: { [field.key]: `${row[field.key]} +` },
      },
      expect: "ok",
    },
  ];
}

function firstTransition(demo: ResolvedDemo, state: DemoState): DemoAction | null {
  for (const entity of demo.entities) {
    if (!entity.transitions || !entity.statusKey) continue;
    for (const row of state.entities[entity.key] ?? []) {
      const current = String(row[entity.statusKey] ?? "");
      const next = entity.transitions[current]?.[0];
      if (next) return { type: "transition", entity: entity.key, id: row.id, to: next };
    }
  }
  return null;
}
