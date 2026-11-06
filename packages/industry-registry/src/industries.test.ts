import { describe, expect, it } from 'vitest';
import { getIndustry, industries, industryContrastReport, industryThemeComplete } from './index';

describe('industry registry', () => {
  it('registers twenty industries as the only source of the test matrix', () => {
    expect(industries).toHaveLength(20);
    const slugs = industries.map((industry) => industry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain('healthcare');
    expect(slugs).toContain('other');
  });

  it('gives every industry a complete, accessible theme and bilingual vocabulary', () => {
    for (const industry of industries) {
      expect(industryThemeComplete(industry), industry.slug).toBe(true);
      const contrast = industryContrastReport(industry);
      for (const mode of contrast) {
        expect(mode.issues, `${industry.slug} ${mode.mode}`).toEqual([]);
      }
      for (const term of Object.values(industry.terminology)) {
        expect(term.en.trim().length).toBeGreaterThan(0);
        expect(term.es.trim().length).toBeGreaterThan(0);
      }
      expect(industry.workflows.length).toBeGreaterThan(0);
      expect(industry.metrics.length).toBeGreaterThan(0);
      expect(industry.problem.en).not.toEqual(industry.problem.es);
      expect(getIndustry(industry.slug)?.primarySolution).toBe(industry.primarySolution);
    }
  });
});
