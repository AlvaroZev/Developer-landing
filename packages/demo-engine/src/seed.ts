import type { IndustryFlavor } from "@triunder/industry-registry";
import type { EntityDef, FieldDef, Row } from "./types";

const COUNT = 6;

function cycle<T>(items: T[], index: number): T {
  const value = items[index % items.length];
  if (value === undefined) throw new Error("empty flavor list");
  return value;
}

function slug(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "") || "person"
  );
}

function emailFor(name: string, org: string): string {
  const domain = slug(org).replace(/\./g, "") || "example";
  return `${slug(name)}@${domain}.example`;
}

function iso(day: number, hour: number): string {
  return `2026-03-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`;
}

function peopleKey(key: string): boolean {
  return [
    "fullName",
    "owner",
    "cashier",
    "reviewer",
    "requester",
    "guest",
    "person",
    "author",
    "approver",
    "payer",
    "driver",
  ].includes(key);
}

/** Deterministic fictional rows. Relation ids assume every entity has COUNT rows. */
export function seedEntities(
  entities: EntityDef[],
  flavor: IndustryFlavor,
  slugName = "tri",
): Record<string, Row[]> {
  const seeded: Record<string, Row[]> = {};
  for (const entity of entities) {
    seeded[entity.key] = Array.from({ length: COUNT }, (_, index) => {
      const row: Row = { id: `${entity.key}-${index + 1}` };
      const hasRange =
        entity.fields.some((item) => item.key === "start") &&
        entity.fields.some((item) => item.key === "end");
      for (const item of entity.fields) {
        row[item.key] = valueFor(entity, item, flavor, index, hasRange, slugName);
      }
      return row;
    });
  }
  return seeded;
}

function valueFor(
  entity: EntityDef,
  item: FieldDef,
  flavor: IndustryFlavor,
  index: number,
  hasRange: boolean,
  slugName: string,
): unknown {
  if (item.type === "relation" && item.relation) return `${item.relation}-${(index % COUNT) + 1}`;
  if (item.type === "status" || item.type === "select") {
    if (item.key === "mode") return index === 0 ? "auto" : "manual";
    if (item.key === "valve") return "closed";
    if (item.key === "state" && entity.key === "robots") return "running";
    return item.options?.[index % (item.options.length || 1)]?.value ?? "";
  }
  if (item.type === "boolean") return item.key === "interlock" ? false : index % 2 === 0;
  if (item.type === "email")
    return emailFor(cycle(flavor.people, index), cycle(flavor.orgs, index));
  if (item.type === "date") {
    if (hasRange && item.key === "start") return iso(10 + index, 9);
    if (hasRange && item.key === "end") return iso(10 + index, 10);
    return iso(10 + index, 15);
  }
  if (item.type === "textarea" || item.key === "body") {
    return `Contact ${emailFor(cycle(flavor.people, 0), cycle(flavor.orgs, 0))} on 2026-03-12 regarding ${cycle(flavor.items, index)}. Amount due 1840.00. ${cycle(flavor.services, index)} at ${cycle(flavor.places, index)}.`;
  }
  if (item.type === "money" || item.type === "number" || item.type === "percent") {
    return numberFor(entity.key, item, index);
  }
  if (item.key === "mrn") return `MRN-24${1000 + index}`;
  if (item.key === "vin") return `1TUUND${String(100000 + index)}`;
  if (item.key === "phone" || item.key === "msisdn") return `+1-202-555-01${index}0`;
  if (item.key === "sku") return `${slugName.slice(0, 3).toUpperCase()}-${100 + index}`;
  if (item.key === "number" || item.key === "reference" || item.key === "serial")
    return `${entity.key.slice(0, 2).toUpperCase()}-${2400 + index}`;
  if (item.key === "firmware" || item.key === "version") return `1.4.${index}`;
  if (peopleKey(item.key)) return cycle(flavor.people, index);
  if (["name", "title", "subject", "item", "crop"].includes(item.key)) {
    if (
      entity.key === "accounts" ||
      entity.key === "vendors" ||
      entity.key === "sellers" ||
      entity.key === "carriers"
    ) {
      return cycle(flavor.orgs, index);
    }
    return index % 2 === 0 ? cycle(flavor.items, index) : cycle(flavor.services, index);
  }
  if (["client", "vendor", "company", "carrier", "customer"].includes(item.key))
    return cycle(flavor.orgs, index);
  if (
    [
      "site",
      "destination",
      "origin",
      "zone",
      "area",
      "city",
      "aisle",
      "location",
      "dock",
      "bay",
      "property",
      "pit",
      "block",
      "feeder",
    ].includes(item.key)
  ) {
    return cycle(flavor.places, index);
  }
  if (item.key === "unit" || item.key === "currency")
    return item.key === "currency" ? flavor.currency : cycle(flavor.assets, index);
  return `${item.label.en} ${index + 1}`;
}

function numberFor(entityKey: string, item: FieldDef, index: number): number {
  const key = item.key;
  let value = 10 + index;
  if (key === "feeRate") value = 0.1;
  else if (key === "stock") value = 20 - index;
  else if (key === "onHand") value = entityKey === "movements" ? 12 : 12 + index;
  else if (key === "reorderAt") value = 8;
  else if (key === "quantity" && entityKey === "movements") value = index === 0 ? -5 : 3;
  else if (key === "quantity") value = 8 + index;
  else if (
    key === "price" ||
    key === "cost" ||
    key === "amount" ||
    key === "balance" ||
    key === "value" ||
    key === "total" ||
    key === "subtotal" ||
    key === "debit"
  )
    value = 120 + index * 35;
  else if (key === "credit") value = 0;
  else if (key === "tax") value = 0;
  else if (key === "margin" || key === "good" || key === "score" || key === "progress") value = 0;
  else if (key === "threshold") value = 80;
  else if (["reading", "moisture", "power", "latency", "heap", "battery", "load"].includes(key))
    value = 30 + index;
  else if (key === "energy") value = 100 + index * 4;
  else if (key === "speed") value = 12;
  else if (key === "output") value = 40;
  else if (key === "setpoint") value = 50;
  else if (key === "processValue") value = 42;
  else if (key === "x") value = 12 + index * 6;
  else if (key === "y") value = 18;
  else if (key === "heading") value = 20 * index;
  else if (key === "shadow") value = 50;
  else if (key === "reported") value = 47;
  else if (key === "usage") value = 40 + index * 5;
  else if (key === "failures") value = index;
  else if (key === "impact") value = 4;
  else if (key === "effort") value = 2;
  else if (key === "weight") value = 1;
  else if (key === "party" || key === "partySize" || key === "seats") value = 2 + (index % 3);
  else if (key === "capacity") value = 20 + index;
  else if (key === "oee" || key === "onTime") value = 78 + index;
  else if (key === "version" || key === "revision") value = index + 1;
  else if (key === "hectares") value = 3 + index;
  else if (key === "minutes") value = 15 + index * 5;
  else if (key === "points") value = 20 * index;
  else if (key === "rows") value = 1000 * (index + 1);
  else if (key === "hours") value = 16;
  else if (key === "visits") value = index + 1;
  else if (key === "exposure" || key === "budget") value = 4000 + index * 250;
  else if (key === "mileage") value = 18000 + index * 1200;
  else if (key === "inputA" || key === "offset" || key === "position") value = index;
  else if (key === "count") value = index + 1;
  else if (key === "target") value = 50;
  if (item.min !== undefined) value = Math.max(item.min, value);
  if (item.max !== undefined) value = Math.min(item.max, value);
  return value;
}

export function finalizeSeed(
  slug: string,
  entities: EntityDef[],
  rows: Record<string, Row[]>,
): Record<string, Row[]> {
  if (slug === "project-management") rollupProjects(rows);
  if (slug === "product-catalogs") {
    for (const product of rows.products ?? []) {
      product.margin = round(Number(product.price ?? 0) - Number(product.cost ?? 0));
    }
  }
  if (slug === "decision-support") {
    for (const option of rows.options ?? []) {
      option.score = Number(option.impact ?? 0) * 2 - Number(option.effort ?? 0);
    }
  }
  if (slug === "predictive-analytics") {
    for (const item of rows.cases ?? []) {
      item.score = clamp(Number(item.usage ?? 0) * 0.4 + Number(item.failures ?? 0) * 12, 0, 100);
    }
  }
  if (slug === "production-planning") {
    for (const material of rows.materials ?? []) {
      material.status = Number(material.required) > Number(material.onHand) ? "short" : "covered";
    }
  }
  if (slug === "hardware-software-integration") {
    for (const device of rows.devices ?? []) {
      device.status = Number(device.shadow) === Number(device.reported) ? "in_sync" : "drifted";
    }
  }
  for (const entity of entities) {
    for (const row of rows[entity.key] ?? []) {
      for (const item of entity.fields) {
        if (
          (item.type === "status" || item.type === "select") &&
          item.options &&
          !item.options.some((option) => option.value === row[item.key])
        ) {
          row[item.key] = item.options[0]?.value ?? row[item.key];
        }
      }
    }
  }
  return rows;
}

export function rollupProjects(rows: Record<string, Row[]>): void {
  for (const project of rows.projects ?? []) {
    const tasks = (rows.tasks ?? []).filter((task) => task.projectId === project.id);
    const done = tasks.filter((task) => task.status === "done").length;
    project.progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  }
}

export function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
