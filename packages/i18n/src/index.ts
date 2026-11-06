/**
 * @triunder/i18n
 *
 * Chrome copy for English and Spanish. Add a string here, in both languages,
 * rather than writing it inside a component.
 *
 * Industry words (patient, work order, shipment) belong to the industry
 * registry or the demo definition, not this dictionary.
 */
import type { Locale } from '@triunder/domain';
import { messages, type MessageKey } from './messages';

export { messages, type MessageKey };
export { en, es, getMessages, t, type MessageTree } from './showroom';

export const LOCALES: readonly Locale[] = ['en', 'es'] as const;

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const table = messages[locale] ?? messages.en;
  let value: string = table[key] ?? messages.en[key] ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
  }
  return value;
}

export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US').format(value);
}

export function formatMoney(locale: Locale, cents: number): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatDate(locale: Locale, iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

