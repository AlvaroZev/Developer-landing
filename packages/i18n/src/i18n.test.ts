import { describe, expect, it } from 'vitest';
import { formatMoney, messages, translate } from './index';

describe('i18n', () => {
  it('has the same keys in English and Spanish', () => {
    const en = Object.keys(messages.en).sort();
    const es = Object.keys(messages.es).sort();
    expect(es).toEqual(en);
    for (const key of en) {
      expect(messages.en[key as keyof typeof messages.en].trim().length).toBeGreaterThan(0);
      expect(messages.es[key as keyof typeof messages.es].trim().length).toBeGreaterThan(0);
    }
  });

  it('interpolates and formats demonstration currency', () => {
    expect(translate('en', 'brand.name')).toBe('Triunder');
    expect(formatMoney('en', 2599)).toBe('$25.99');
  });
});
