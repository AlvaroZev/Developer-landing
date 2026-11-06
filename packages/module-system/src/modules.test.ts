import { describe, expect, it } from 'vitest';
import { getModule, listModules, planAddition, planRemoval } from './index';

describe('module system', () => {
  it('registers unique modules with both languages', () => {
    const ids = listModules().map((module) => module.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const module of listModules()) {
      expect(module.name.es.length).toBeGreaterThan(0);
      expect(module.entities.length).toBeGreaterThan(0);
    }
  });

  it('requires iot monitoring before embedded diagnostics, and can add both', () => {
    const blocked = planAddition([], 'embedded-diagnostics', 'smart-agriculture', 'agriculture');
    expect(blocked).toEqual({ ok: false, code: 'dependency', moduleId: 'iot-monitoring' });
    const planned = planAddition([], 'embedded-diagnostics', 'smart-agriculture', 'agriculture', true);
    expect(planned.ok).toBe(true);
    if (planned.ok) {
      expect(planned.activate).toEqual(['iot-monitoring', 'embedded-diagnostics']);
    }
  });

  it('refuses an inventory module on a healthcare CRM', () => {
    expect(planAddition([], 'inventory', 'crm', 'healthcare').ok).toBe(false);
  });

  it('blocks removal of a dependency unless forced', () => {
    const active = ['iot-monitoring', 'embedded-diagnostics'];
    const blocked = planRemoval(active, 'iot-monitoring');
    expect(blocked.ok).toBe(false);
    if (!blocked.ok && blocked.code === 'dependents') {
      expect(blocked.dependents).toContain('embedded-diagnostics');
    }
    const forced = planRemoval(active, 'iot-monitoring', true);
    expect(forced).toEqual({ ok: true, remove: ['iot-monitoring', 'embedded-diagnostics'] });
  });

  it('knows the maintenance listener used by threshold alerts', () => {
    expect(getModule('maintenance')?.listens).toContain('iot.threshold.breached');
    expect(getModule('inventory')?.listens).toContain('commerce.order.placed');
  });
});
