import { REQUIREMENT_SECTION_KEYS, type Complexity } from '@triunder/domain';
import { listIndustries } from '@triunder/industry-registry';
import { planAddition } from '@triunder/module-system';
import { getSolutionBySlug, listSolutions } from '@triunder/solution-registry';
import { describe, expect, it } from 'vitest';
import {
  applyAction,
  buildScopeOutline,
  createSession,
  demoPath,
  getDemo,
  listDemos,
  navigationFor,
  parseLevel,
  parseModules,
  queryRecords,
  restoreSession,
  schemasFor,
} from './index';

describe('showroom matrix', () => {
  it('derives supported combinations from demos, one for every industry', () => {
    const demos = listDemos();
    expect(new Set(demos.map((demo) => demo.id)).size).toBe(demos.length);
    for (const industry of listIndustries()) {
      const demo = getDemo(industry.slug, industry.primarySolution);
      expect(demo, industry.slug).toBeDefined();
      expect(demo?.industry).toBe(industry.slug);
    }
  });

  it('rejects pairs that are not demonstrated', () => {
    expect(getDemo('healthcare', 'mes')).toBeUndefined();
    expect(createSession('healthcare', 'mes', 'professional').error).toBe('unsupported');
    const relevant = getSolutionBySlug('mes')?.compatibleIndustryIds.includes('manufacturing');
    expect(relevant).toBe(true);
  });

  it('checks every demo against industry, solution, theme vocabulary, and modules', () => {
    for (const demo of listDemos()) {
      const industry = listIndustries().find((item) => item.slug === demo.industry);
      const solution = getSolutionBySlug(demo.solution);
      expect(industry, demo.id).toBeDefined();
      expect(solution, demo.id).toBeDefined();
      expect(solution?.compatibleIndustryIds, demo.id).toContain(demo.industry);
      expect(demo.navigation.length).toBeGreaterThan(0);
      expect(demo.entities.length).toBeGreaterThan(0);
      expect(demo.workflows.length).toBeGreaterThan(0);
      expect(demo.summary.es.length).toBeGreaterThan(0);
      for (const schema of demo.entities) {
        expect(schema.fields.length).toBeGreaterThan(0);
        expect(schema.singular.es.length).toBeGreaterThan(0);
        const rows = demo.seed[schema.key] ?? [];
        expect(rows.length).toBeGreaterThan(0);
        const ids = rows.map((row) => row.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
      for (const moduleId of demo.optionalModules) {
        const planned = planAddition([], moduleId, demo.solution, demo.industry, true);
        expect(planned.ok, `${demo.id}:${moduleId}`).toBe(true);
      }
      const session = createSession(demo.industry, demo.solution, 'professional');
      expect(session.state, demo.id).not.toBeNull();
      if (!session.state) continue;
      const schemas = schemasFor(demo, []);
      expect(schemas.map((schema) => schema.key)).toEqual(demo.entities.map((schema) => schema.key));
      expect(navigationFor(demo, [], 'starter').some((item) => item.minComplexity === 'enterprise')).toBe(false);
      const first = schemas[0];
      const rows = session.state.entities[first?.key ?? ''] ?? [];
      if (first && rows.length > 0) {
        const primary = String(rows[0]?.[first.primary] ?? '');
        expect(queryRecords(rows, first, { text: primary.slice(0, 3) }).length).toBeGreaterThan(0);
        expect(queryRecords(rows, first, { text: '___missing___' })).toEqual([]);
      }
    }
    const demoSolutions = new Set(listDemos().map((demo) => demo.solution));
    expect(listSolutions().length).toBeGreaterThanOrEqual(demoSolutions.size);
  });

  it('round-trips shareable routes and falls back on a bad saved state', () => {
    expect(parseLevel('enterprise')).toBe('enterprise');
    expect(parseLevel('nope')).toBe('professional');
    expect(parseModules('inventory,inventory,analytics')).toEqual(['inventory', 'analytics']);
    const path = demoPath('manufacturing', 'mes', 'enterprise', ['inventory']);
    expect(path).toBe('/explore/manufacturing/mes/app/dashboard?level=enterprise&modules=inventory');
    const fresh = restoreSession({ nope: true }, 'retail', 'ecommerce', 'starter');
    expect(fresh.state?.definitionId).toBe('retail-commerce');
    const saved = createSession('retail', 'ecommerce', 'professional').state;
    const restored = restoreSession(saved, 'retail', 'ecommerce', 'enterprise');
    expect(restored.state?.complexity).toBe('enterprise');
    expect(restored.state?.cart).toEqual([]);
  });

  it('builds a sixteen-section brief without prices in both languages', () => {
    for (const locale of ['en', 'es'] as const) {
      const sections = buildScopeOutline({
        industry: 'manufacturing',
        solution: 'mes',
        complexity: 'professional' satisfies Complexity,
        modules: ['inventory', 'robotics-cell'],
        description: 'The saw stops and nobody hears.',
        locale,
      });
      expect(sections.map((section) => section.key)).toEqual([...REQUIREMENT_SECTION_KEYS]);
      const body = sections.map((section) => section.body).join('\n');
      expect(body).not.toMatch(/\$\d/);
      expect(body.toLowerCase()).toContain(locale === 'es' ? 'no incluye precio' : 'no price');
      expect(sections.every((section) => section.origin === 'template')).toBe(true);
      expect(body.length).toBeGreaterThan(200);
    }
  });

  it('keeps routine notices off the starter depth and writes an enterprise audit', () => {
    const starter = createSession('healthcare', 'crm', 'starter').state;
    if (!starter) throw new Error('missing healthcare');
    const created = applyAction(starter, {
      type: 'special',
      name: 'appointment.create',
      payload: { patientId: 'pat-mara', professionalId: 'pro-leona', start: '2026-04-21T09:00:00.000Z', reason: 'Check' },
    });
    expect(created.error).toBeUndefined();
    expect(created.state.notifications).toHaveLength(0);
    expect(created.state.audit).toHaveLength(0);

    const enterprise = createSession('healthcare', 'crm', 'enterprise').state;
    if (!enterprise) throw new Error('missing healthcare');
    const audited = applyAction(enterprise, {
      type: 'special',
      name: 'appointment.create',
      payload: { patientId: 'pat-mara', professionalId: 'pro-leona', start: '2026-04-21T09:00:00.000Z', reason: 'Check' },
    });
    expect(audited.state.audit.length).toBeGreaterThan(0);
    expect(audited.state.notifications.length).toBeGreaterThan(0);
  });
});
