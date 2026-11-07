import type { DemoState, Row, WidgetDef } from "./types";

export interface RowQuery {
  search?: string;
  filters?: Record<string, string>;
  sort?: string;
  direction?: "asc" | "desc";
}

export function queryRows(rows: Row[], searchable: string[], query: RowQuery): Row[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  let result = rows.filter((row) => {
    const matchesSearch =
      !search ||
      searchable.some((key) =>
        String(row[key] ?? "")
          .toLowerCase()
          .includes(search),
      );
    const matchesFilter = Object.entries(query.filters ?? {}).every(([key, value]) => {
      if (!value || value === "all") return true;
      return String(row[key] ?? "") === value;
    });
    return matchesSearch && matchesFilter;
  });
  if (query.sort) {
    const key = query.sort;
    const direction = query.direction === "desc" ? -1 : 1;
    result = [...result].sort((a, b) => {
      const left = a[key];
      const right = b[key];
      if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
      return String(left ?? "").localeCompare(String(right ?? "")) * direction;
    });
  }
  return result;
}

export function rowLabel(row: Row): string {
  for (const key of [
    "name",
    "title",
    "fullName",
    "number",
    "sku",
    "unit",
    "reference",
    "subject",
    "code",
  ]) {
    if (typeof row[key] === "string" && row[key]) return String(row[key]);
  }
  return row.id;
}

export function widgetSlices(
  state: DemoState,
  widget: WidgetDef,
): { label: string; value: number }[] {
  const rows = state.entities[widget.entity] ?? [];
  if (widget.kind === "donut") {
    const group = widget.groupBy ?? "status";
    const counts = new Map<string, number>();
    for (const row of rows) {
      const label = String(row[group] ?? "—");
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, value]) => ({ label, value }));
  }
  if (widget.kind === "bar") {
    return rows
      .slice(0, 6)
      .map((row) => ({ label: rowLabel(row), value: Number(row[widget.field ?? ""] ?? 0) }));
  }
  return [];
}

export function widgetNumber(state: DemoState, widget: WidgetDef): number {
  const rows = (state.entities[widget.entity] ?? []).filter(
    (row) => !widget.equals || String(row[widget.field ?? "status"] ?? "") === widget.equals,
  );
  if (widget.kind === "count" || widget.kind === "alerts") return rows.length;
  const numbers = rows
    .map((row) => Number(row[widget.field ?? ""] ?? 0))
    .filter((value) => Number.isFinite(value));
  if (!numbers.length) return 0;
  const total = numbers.reduce((sum, value) => sum + value, 0);
  if (widget.kind === "avg") return Math.round((total / numbers.length) * 10) / 10;
  return Math.round(total * 100) / 100;
}
