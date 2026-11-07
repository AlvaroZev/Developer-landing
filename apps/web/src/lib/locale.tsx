import { type Locale, type MessagePath, isLocale, translate } from "@triunder/i18n";
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

interface LocaleValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: MessagePath, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleValue | null>(null);
const KEY = "triunder.locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(KEY);
    return isLocale(stored) ? stored : "en";
  });

  useEffect(() => {
    localStorage.setItem(KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (path, vars) => translate(locale, path, vars),
    }),
    [locale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("LocaleProvider is missing");
  return value;
}
