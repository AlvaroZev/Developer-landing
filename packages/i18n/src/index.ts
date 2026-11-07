import { type Messages, en, es } from "./messages";

/**
 * @triunder/i18n
 *
 * English and Spanish for the product shell. Add a language by adding a
 * catalog that satisfies `DeepString<typeof en>` and a locale code here.
 * Do not hardcode visitor-facing chrome strings in components.
 */
export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

const catalogs: Record<Locale, Messages> = { en: en as Messages, es };

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessagePath = Leaves<Messages>;

function read(tree: unknown, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, tree);
  return typeof value === "string" ? value : undefined;
}

export function translate(
  locale: Locale,
  path: MessagePath,
  vars?: Record<string, string | number>,
): string {
  const value = read(catalogs[locale], path) ?? read(catalogs.en, path) ?? path;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "es";
}

export function formatNumber(locale: Locale, value: number, digits = 0): string {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatMoney(locale: Locale, value: number, currency = "USD"): string {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(locale: Locale, value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function messageTree(locale: Locale): Messages {
  return catalogs[locale];
}

export { en, es };
