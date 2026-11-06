import { text, type EntitySchema, type FieldDef, type NavItem } from '@triunder/domain';

export function field(
  key: string,
  type: FieldDef['type'],
  en: string,
  es: string,
  extra: Partial<FieldDef> = {},
): FieldDef {
  return {
    key,
    type,
    label: text(en, es),
    table: extra.table ?? true,
    form: extra.form ?? true,
    sortable: extra.sortable ?? true,
    ...extra,
  };
}

export function statusField(options: readonly (readonly [string, string, string])[]): FieldDef {
  return field('status', 'status', 'Status', 'Estado', {
    required: true,
    filterable: true,
    options: options.map(([value, en, es]) => ({ value, label: text(en, es) })),
  });
}

export function entity(
  key: string,
  singular: readonly [string, string],
  plural: readonly [string, string],
  primary: string,
  fields: FieldDef[],
  search: string[],
  statusFieldName?: string,
): EntitySchema {
  return {
    key,
    singular: text(singular[0], singular[1]),
    plural: text(plural[0], plural[1]),
    primary,
    search,
    fields,
    statusField: statusFieldName,
  };
}

export function nav(
  id: string,
  en: string,
  es: string,
  icon: string,
  view: NavItem['view'],
  extra: Partial<NavItem> = {},
): NavItem {
  return { id, label: text(en, es), icon, view, ...extra };
}
