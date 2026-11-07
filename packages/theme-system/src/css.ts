import { TOKEN_KEYS, type ThemeTokens } from "./types";

const CSS_NAMES: Record<(typeof TOKEN_KEYS)[number], string> = {
  primary: "--primary",
  secondary: "--secondary",
  accent: "--accent",
  background: "--bg",
  surface: "--surface",
  sidebar: "--sidebar",
  header: "--header",
  text: "--text",
  muted: "--muted",
  border: "--border",
  button: "--button",
  buttonText: "--button-text",
  success: "--success",
  warning: "--warning",
  error: "--error",
  focus: "--focus",
};

/** Maps a token set onto the CSS variables the shared UI reads. */
export function themeToCssVars(theme: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const key of TOKEN_KEYS) {
    vars[CSS_NAMES[key]] = theme[key];
  }
  theme.chart.forEach((color, index) => {
    vars[`--chart-${index}`] = color;
  });
  return vars;
}

export function cssVarStyle(theme: ThemeTokens): Record<string, string> {
  return themeToCssVars(theme);
}
