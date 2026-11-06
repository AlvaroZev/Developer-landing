import { createContext, useContext } from "react";
import type { ColorMode } from "@triunder/domain";

interface ThemeContextValue {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  colorMode: "light",
  setColorMode: () => undefined,
});

export function useThemeMode() {
  return useContext(ThemeContext);
}
