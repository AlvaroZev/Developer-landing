import type { EntityRecord, EntitySchema } from '@triunder/domain';

export interface RecordQuery {
  text?: string;
  status?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

/** Client-side query used by tables. Kept pure so UI tests and unit tests share it. */
export function queryRecords(
  records: readonly EntityRecord[],
  schema: EntitySchema,
  query: RecordQuery = {},
): EntityRecord[] {
  const needle = query.text?.trim().toLowerCase() ?? '';
  let rows = records.filter((record) => {
    if (query.status && query.status !== 'all' && String(record.status ?? '') !== query.status) return false;
    if (!needle) return true;
    return schema.search.some((key) => String(record[key] ?? '').toLowerCase().includes(needle));
  });
  if (query.sort) {
    const sort = query.sort;
    const direction = query.direction === 'desc' ? -1 : 1;
    rows = [...rows].sort((a, b) => {
      const left = a[sort];
      const right = b[sort];
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * direction;
      return String(left ?? '').localeCompare(String(right ?? '')) * direction;
    });
  }
  return rows;
}

export function metricValue(
  entities: Record<string, EntityRecord[]>,
  metric: { kind: 'count' | 'countWhere' | 'sum'; entity: string; field?: string; equals?: string },
): number {
  const rows = entities[metric.entity] ?? [];
  if (metric.kind === 'count') return rows.length;
  if (metric.kind === 'countWhere') {
    return rows.filter((row) => String(row[metric.field ?? 'status'] ?? '') === metric.equals).length;
  }
  return rows.reduce((sum, row) => sum + (typeof row[metric.field ?? ''] === 'number' ? Number(row[metric.field ?? '']) : 0), 0);
}

export function statusCounts(records: readonly EntityRecord[], field = 'status'): { status: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    const status = String(record[field] ?? 'unknown');
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return [...counts.entries()].map(([status, count]) => ({ status, count }));
}
