import { describe, expect, it } from 'vitest';
import {
  COMPLEXITY_LEVELS,
  REQUIREMENT_SECTION_KEYS,
  complexityRank,
  meetsComplexity,
  readLocale,
  text,
} from './index';

describe('domain vocabulary', () => {
  it('orders complexity from starter to enterprise', () => {
    expect(COMPLEXITY_LEVELS.map(complexityRank)).toEqual([0, 1, 2]);
    expect(meetsComplexity('professional', 'starter')).toBe(true);
    expect(meetsComplexity('starter', 'enterprise')).toBe(false);
    expect(meetsComplexity('enterprise', undefined)).toBe(true);
  });

  it('keeps the requirements section contract stable and unique', () => {
    expect(new Set(REQUIREMENT_SECTION_KEYS).size).toBe(REQUIREMENT_SECTION_KEYS.length);
    expect(REQUIREMENT_SECTION_KEYS).toHaveLength(16);
    expect(REQUIREMENT_SECTION_KEYS[0]).toBe('business_context');
    expect(REQUIREMENT_SECTION_KEYS.at(-1)).toBe('recommended_next_steps');
  });

  it('reads locale text with an English fallback', () => {
    expect(readLocale(text('Patient', 'Paciente'), 'es')).toBe('Paciente');
    expect(readLocale(text('Patient', ''), 'es')).toBe('Patient');
    expect(readLocale(undefined, 'en')).toBe('');
  });
});
