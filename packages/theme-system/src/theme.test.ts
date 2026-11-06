import { describe, expect, it } from 'vitest';
import { brandTheme, contrastIssues, contrastRatio, cssVariables, tokenKeysComplete } from './index';

describe('theme system', () => {
  it('gives the brand pair accessible text and a stable variable map', () => {
    for (const mode of ['light', 'dark'] as const) {
      expect(tokenKeysComplete(brandTheme[mode])).toBe(true);
      expect(contrastIssues(brandTheme[mode])).toEqual([]);
    }
    const vars = cssVariables(brandTheme.light);
    expect(vars['--tu-bg']).toBe(brandTheme.light.bg);
    expect(vars['--tu-on-primary']).toBe(brandTheme.light.onPrimary);
    expect(vars['--tu-chart-1']).toBe(brandTheme.light.chart[0]);
  });

  it('computes a known black-on-white contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });
});
