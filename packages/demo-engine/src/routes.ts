import type { Complexity } from '@triunder/domain';

/** Shareable showroom URLs. The query string is the configuration, not the demo data. */
export function demoPath(
  industry: string,
  solution: string,
  level: Complexity,
  modules: readonly string[] = [],
): string {
  const params = new URLSearchParams();
  params.set('level', level);
  if (modules.length > 0) params.set('modules', modules.join(','));
  return `/explore/${industry}/${solution}/app/dashboard?${params.toString()}`;
}

export function parseLevel(value: string | null | undefined): Complexity {
  if (value === 'starter' || value === 'professional' || value === 'enterprise') return value;
  return 'professional';
}

export function parseModules(value: string | null | undefined): string[] {
  if (!value) return [];
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}
