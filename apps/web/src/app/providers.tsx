import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { ColorMode, ComplexityLevel, Locale, ProjectConfiguration } from "@triunder/domain";
import { getMessages } from "@triunder/i18n";
import { applyThemeToElement, TRIUNDER_BRAND_DARK, TRIUNDER_BRAND_LIGHT } from "@triunder/theme-system";
import { I18nContext } from "../state/i18n-context";
import { ThemeContext } from "../state/theme-context";
import { ConfigContext } from "../state/config-context";

const LOCALE_KEY = "triunder.locale";
const MODE_KEY = "triunder.colorMode";
const CONFIG_KEY = "triunder.configuration";

function readLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_KEY);
  return stored === "es" ? "es" : "en";
}

function readMode(): ColorMode {
  const stored = localStorage.getItem(MODE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readConfig(): ProjectConfiguration | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProjectConfiguration;
  } catch {
    return null;
  }
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);
  const [colorMode, setColorModeState] = useState<ColorMode>(readMode);
  const [configuration, setConfigurationState] = useState<ProjectConfiguration | null>(readConfig);

  const messages = useMemo(() => getMessages(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", colorMode === "dark");
    localStorage.setItem(MODE_KEY, colorMode);
    applyThemeToElement(
      document.documentElement,
      colorMode === "dark" ? TRIUNDER_BRAND_DARK : TRIUNDER_BRAND_LIGHT,
    );
  }, [colorMode]);

  const setLocale = (next: Locale) => setLocaleState(next);
  const setColorMode = (next: ColorMode) => setColorModeState(next);

  const updateConfiguration = ( partial: Partial<ProjectConfiguration> &
      Pick<ProjectConfiguration, "industryId" | "solutionId">,
  ) => {
    setConfigurationState((prev) => {
      const next: ProjectConfiguration = {
        industryId: partial.industryId,
        solutionId: partial.solutionId,
        complexity: (partial.complexity ??
          prev?.complexity ??
          "professional") as ComplexityLevel,
        moduleIds: partial.moduleIds ?? prev?.moduleIds ?? [],
        locale: partial.locale ?? locale,
        colorMode: partial.colorMode ?? colorMode,
        customDescription: partial.customDescription ?? prev?.customDescription,
      };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearConfiguration = () => {
    localStorage.removeItem(CONFIG_KEY);
    setConfigurationState(null);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, messages }}>
      <ThemeContext.Provider value={{ colorMode, setColorMode }}>
        <ConfigContext.Provider
          value={{ configuration, updateConfiguration, clearConfiguration }}
        >
          {children}
        </ConfigContext.Provider>
      </ThemeContext.Provider>
    </I18nContext.Provider>
  );
}
