import type { ThemePair, ThemeTokens } from '@triunder/theme-system';

/**
 * Industry palettes share text treatment so contrast stays predictable.
 * Only the chromatic roles change per industry. Do not scatter one-off
 * text colors through feature CSS.
 */
interface PaletteSpec {
  primary: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  bg: string;
  surface: string;
  sidebar: string;
  header: string;
  secondary: string;
  border: string;
  chart: [string, string, string, string, string];
  darkPrimary: string;
  darkOnPrimary: string;
  darkAccent: string;
  darkOnAccent: string;
  darkBg: string;
  darkSurface: string;
  darkSidebar: string;
  darkHeader: string;
  darkSecondary: string;
  darkBorder: string;
  darkChart: [string, string, string, string, string];
}

const lightText = {
  text: '#14201C',
  muted: '#3C4A46',
  success: '#14663A',
  warning: '#7A4E00',
  danger: '#8C2424',
  onDanger: '#FFF8F8',
} as const;

const darkText = {
  text: '#F4F7F6',
  muted: '#C5D0CC',
  success: '#8ED0A8',
  warning: '#E6C27A',
  danger: '#F0A8A8',
  onDanger: '#2A1212',
} as const;

export function industryTheme(spec: PaletteSpec): ThemePair {
  const light: ThemeTokens = {
    ...lightText,
    primary: spec.primary,
    onPrimary: spec.onPrimary,
    secondary: spec.secondary,
    accent: spec.accent,
    onAccent: spec.onAccent,
    bg: spec.bg,
    surface: spec.surface,
    sidebar: spec.sidebar,
    header: spec.header,
    border: spec.border,
    chart: spec.chart,
    focus: spec.accent,
  };
  const dark: ThemeTokens = {
    ...darkText,
    primary: spec.darkPrimary,
    onPrimary: spec.darkOnPrimary,
    secondary: spec.darkSecondary,
    accent: spec.darkAccent,
    onAccent: spec.darkOnAccent,
    bg: spec.darkBg,
    surface: spec.darkSurface,
    sidebar: spec.darkSidebar,
    header: spec.darkHeader,
    border: spec.darkBorder,
    chart: spec.darkChart,
    focus: spec.darkAccent,
  };
  return { light, dark };
}
