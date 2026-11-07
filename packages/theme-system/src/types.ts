/**
 * Design tokens for the Triunder brand and for each industry demonstration.
 *
 * Tokens are data. Components never branch on industry name to pick a color.
 * `themeToCssVars` is the only bridge from a token set to CSS.
 */
export interface ThemeTokens {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  sidebar: string;
  header: string;
  text: string;
  muted: string;
  border: string;
  chart: [string, string, string, string, string, string];
  button: string;
  buttonText: string;
  success: string;
  warning: string;
  error: string;
  focus: string;
}

export interface IndustryTheme {
  light: ThemeTokens;
  dark: ThemeTokens;
}

export const TOKEN_KEYS = [
  "primary",
  "secondary",
  "accent",
  "background",
  "surface",
  "sidebar",
  "header",
  "text",
  "muted",
  "border",
  "button",
  "buttonText",
  "success",
  "warning",
  "error",
  "focus",
] as const;
