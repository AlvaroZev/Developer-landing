import type {
  Blueprint,
  Copy,
  EntityDef,
  FieldDef,
  FieldType,
  OptionDef,
  WidgetDef,
} from "./types";

export const L = (en: string, es: string): Copy => ({ en, es });

export function opt(value: string, en: string, es: string): OptionDef {
  return { value, label: L(en, es) };
}

export function field(
  key: string,
  en: string,
  es: string,
  type: FieldType,
  extra: Partial<FieldDef> = {},
): FieldDef {
  return {
    table: type !== "textarea",
    form: true,
    searchable: type === "text" || type === "email" || type === "textarea",
    sortable: type !== "textarea",
    filterable: type === "status" || type === "select" || type === "boolean",
    ...extra,
    key,
    label: L(en, es),
    type,
  };
}

export const text = (key: string, en: string, es: string, extra?: Partial<FieldDef>) =>
  field(key, en, es, "text", extra);
export const area = (key: string, en: string, es: string, extra?: Partial<FieldDef>) =>
  field(key, en, es, "textarea", { table: false, ...extra });
export const num = (key: string, en: string, es: string, extra?: Partial<FieldDef>) =>
  field(key, en, es, "number", extra);
export const money = (key: string, en: string, es: string, extra?: Partial<FieldDef>) =>
  field(key, en, es, "money", extra);
export const pct = (key: string, en: string, es: string, extra?: Partial<FieldDef>) =>
  field(key, en, es, "percent", { min: 0, max: 100, ...extra });
export const date = (key: string, en: string, es: string, extra?: Partial<FieldDef>) =>
  field(key, en, es, "date", extra);
export const email = (key: string, en: string, es: string, extra?: Partial<FieldDef>) =>
  field(key, en, es, "email", extra);
export const bool = (key: string, en: string, es: string, extra?: Partial<FieldDef>) =>
  field(key, en, es, "boolean", extra);
export const rel = (
  key: string,
  en: string,
  es: string,
  relation: string,
  extra?: Partial<FieldDef>,
) => field(key, en, es, "relation", { relation, ...extra });

export function select(
  key: string,
  en: string,
  es: string,
  options: OptionDef[],
  extra?: Partial<FieldDef>,
): FieldDef {
  return field(key, en, es, "select", { options, ...extra });
}

export function status(options: OptionDef[], key = "status"): FieldDef {
  return field(key, "Status", "Estado", "status", { required: true, options });
}

/** Happy-path transitions, plus optional side exits such as cancel. */
export function flow(
  order: string[],
  side: { from: string; to: string[] }[] = [],
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  order.forEach((state, index) => {
    const next = order[index + 1];
    map[state] = next ? [next] : [];
  });
  for (const exit of side) {
    map[exit.from] = [...new Set([...(map[exit.from] ?? []), ...exit.to])];
  }
  return map;
}

export function entity(
  key: string,
  singular: Copy,
  plural: Copy,
  fields: FieldDef[],
  transitions?: Record<string, string[]>,
): EntityDef {
  const statusField = fields.find((item) => item.type === "status");
  return {
    key,
    singular,
    plural,
    fields,
    statusKey: statusField?.key,
    transitions,
  };
}

export function count(
  id: string,
  en: string,
  es: string,
  entityKey: string,
  equals?: string,
): WidgetDef {
  return { id, kind: "count", title: L(en, es), entity: entityKey, field: "status", equals };
}

export function sum(
  id: string,
  en: string,
  es: string,
  entityKey: string,
  fieldKey: string,
): WidgetDef {
  return { id, kind: "sum", title: L(en, es), entity: entityKey, field: fieldKey };
}

export function donut(
  id: string,
  en: string,
  es: string,
  entityKey: string,
  groupBy = "status",
): WidgetDef {
  return { id, kind: "donut", title: L(en, es), entity: entityKey, groupBy };
}

export function bars(
  id: string,
  en: string,
  es: string,
  entityKey: string,
  fieldKey: string,
): WidgetDef {
  return { id, kind: "bar", title: L(en, es), entity: entityKey, field: fieldKey };
}

export function defineBlueprint(input: Blueprint): Blueprint {
  const keys = new Set(input.entities.map((item) => item.key));
  for (const item of input.entities) {
    const seen = new Set<string>();
    for (const itemField of item.fields) {
      if (seen.has(itemField.key))
        throw new Error(`${input.slug}.${item.key}.${itemField.key} duplicate`);
      seen.add(itemField.key);
      if (itemField.type === "relation" && !keys.has(itemField.relation ?? "")) {
        throw new Error(`${input.slug}.${item.key}.${itemField.key} relation`);
      }
      if (
        (itemField.type === "select" || itemField.type === "status") &&
        !itemField.options?.length
      ) {
        throw new Error(`${input.slug}.${item.key}.${itemField.key} options`);
      }
    }
    if (item.transitions && item.statusKey) {
      for (const value of Object.keys(item.transitions)) {
        const options =
          item.fields.find((candidate) => candidate.key === item.statusKey)?.options ?? [];
        if (!options.some((option) => option.value === value)) {
          throw new Error(`${input.slug}.${item.key} transition ${value}`);
        }
      }
    }
  }
  for (const widget of input.dashboard) {
    if (!keys.has(widget.entity)) throw new Error(`${input.slug} widget ${widget.entity}`);
  }
  return input;
}
