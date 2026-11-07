import { type ThemeTokens, brandTheme, themeToCssVars } from "@triunder/theme-system";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

type Mode = "light" | "dark";
const KEY = "triunder.theme";

const ThemeContext = createContext<{ mode: Mode; toggle: () => void } | null>(null);

function preferred(): Mode {
  const stored = localStorage.getItem(KEY);
  if (stored === "light" || stored === "dark") return stored;
  if (typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTokens(tokens: ThemeTokens, node: HTMLElement = document.documentElement) {
  for (const [key, value] of Object.entries(themeToCssVars(tokens)))
    node.style.setProperty(key, value);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => preferred());
  useEffect(() => {
    localStorage.setItem(KEY, mode);
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    applyTokens(mode === "dark" ? brandTheme.dark : brandTheme.light);
  }, [mode]);
  return (
    <ThemeContext.Provider
      value={{ mode, toggle: () => setMode((current) => (current === "dark" ? "light" : "dark")) }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("ThemeProvider is missing");
  return value;
}
