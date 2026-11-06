import { createContext, useContext } from "react";
import type { Locale } from "@triunder/domain";
import type { MessageTree } from "@triunder/i18n";
import { en } from "@triunder/i18n";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: MessageTree;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => undefined,
  messages: en,
});

export function useI18n() {
  return useContext(I18nContext);
}
