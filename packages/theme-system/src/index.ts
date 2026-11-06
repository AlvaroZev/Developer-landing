/**
 * @triunder/theme-system
 *
 * Design tokens and contrast checks. Industry registries supply values;
 * components must consume CSS variables produced by `cssVariables` rather
 * than branching on industry names in CSS.
 *
 * To add a token, extend ThemeTokens, map it in cssVariables, and update
 * the contrast rules if the token carries text.
 */

export interface ThemeTokens {
  primary: string;
  onPrimary: string;
  secondary: string;
  accent: string;
  onAccent: string;
  bg: string;
  surface: string;
  sidebar: string;
  header: string;
  text: string;
  muted: string;
  border: string;
  chart: [string, string, string, string, string];
  success: string;
  warning: string;
  danger: string;
  onDanger: string;
  focus: string;
}

export interface ThemePair {
  light: ThemeTokens;
  dark: ThemeTokens;
}

const TOKEN_KEYS: (keyof Omit<ThemeTokens, 'chart'>)[] = [
  'primary',
  'onPrimary',
  'secondary',
  'accent',
  'onAccent',
  'bg',
  'surface',
  'sidebar',
  'header',
  'text',
  'muted',
  'border',
  'success',
  'warning',
  'danger',
  'onDanger',
  'focus',
];

/** Triunder chrome. Demo canvases use industry tokens instead. */
export const brandTheme: ThemePair = {
  light: {
    primary: '#1C2430',
    onPrimary: '#F7F4EE',
    secondary: '#E4DDD2',
    accent: '#8C4E16',
    onAccent: '#FFF8F1',
    bg: '#F3EFE7',
    surface: '#FFFCF7',
    sidebar: '#E7E1D6',
    header: '#FFFCF7',
    text: '#16181C',
    muted: '#5C564C',
    border: '#D5CBBC',
    chart: ['#1C2430', '#8C4E16', '#3E6B58', '#8A5A44', '#4E6278'],
    success: '#1B6B3A',
    warning: '#8A5A00',
    danger: '#9B2C2C',
    onDanger: '#FFF7F7',
    focus: '#8C4E16',
  },
  dark: {
    primary: '#E7E1D6',
    onPrimary: '#14181D',
    secondary: '#2A313A',
    accent: '#E0A15A',
    onAccent: '#241607',
    bg: '#101317',
    surface: '#191E25',
    sidebar: '#14181D',
    header: '#14181D',
    text: '#F3EFE7',
    muted: '#C2B8AA',
    border: '#343B45',
    chart: ['#E0A15A', '#8FB9A4', '#F3EFE7', '#D2A08A', '#9BB0C4'],
    success: '#7DCEA0',
    warning: '#E6C07B',
    danger: '#F0A0A0',
    onDanger: '#2A1212',
    focus: '#E0A15A',
  },
};

export function cssVariables(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const key of TOKEN_KEYS) {
    vars[`--tu-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`] = tokens[key];
  }
  tokens.chart.forEach((color, index) => {
    vars[`--tu-chart-${index + 1}`] = color;
  });
  return vars;
}

function channel(hex: string, index: number): number {
  return Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
}

function linearize(value: number): number {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const normalized = hex.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(normalized)) {
    throw new Error(`Expected #RRGGBB color, received ${hex}`);
  }
  const r = linearize(channel(normalized, 0));
  const g = linearize(channel(normalized, 1));
  const b = linearize(channel(normalized, 2));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastIssue {
  pair: string;
  ratio: number;
  minimum: number;
}

/**
 * Text pairs use WCAG AA 4.5:1. Secondary and chart colors are checked more
 * loosely so a palette can stay expressive without disappearing into the surface.
 */
export function contrastIssues(tokens: ThemeTokens): ContrastIssue[] {
  const pairs: { pair: string; fg: string; bg: string; minimum: number }[] = [
    { pair: 'text/bg', fg: tokens.text, bg: tokens.bg, minimum: 4.5 },
    { pair: 'text/surface', fg: tokens.text, bg: tokens.surface, minimum: 4.5 },
    { pair: 'text/sidebar', fg: tokens.text, bg: tokens.sidebar, minimum: 4.5 },
    { pair: 'text/header', fg: tokens.text, bg: tokens.header, minimum: 4.5 },
    { pair: 'muted/bg', fg: tokens.muted, bg: tokens.bg, minimum: 4.5 },
    { pair: 'muted/surface', fg: tokens.muted, bg: tokens.surface, minimum: 4.5 },
    { pair: 'onPrimary/primary', fg: tokens.onPrimary, bg: tokens.primary, minimum: 4.5 },
    { pair: 'onAccent/accent', fg: tokens.onAccent, bg: tokens.accent, minimum: 4.5 },
    { pair: 'onDanger/danger', fg: tokens.onDanger, bg: tokens.danger, minimum: 4.5 },
  ];
  const issues: ContrastIssue[] = [];
  for (const pair of pairs) {
    const ratio = contrastRatio(pair.fg, pair.bg);
    if (ratio < pair.minimum) {
      issues.push({ pair: pair.pair, ratio, minimum: pair.minimum });
    }
  }
  tokens.chart.forEach((color, index) => {
    const ratio = contrastRatio(color, tokens.surface);
    if (ratio < 1.4) {
      issues.push({ pair: `chart-${index + 1}/surface`, ratio, minimum: 1.4 });
    }
  });
  return issues;
}

export function tokenKeysComplete(tokens: ThemeTokens): boolean {
  return TOKEN_KEYS.every((key) => typeof tokens[key] === 'string' && tokens[key].length > 0)
    && tokens.chart.length === 5;
}

/**
 * Apply tokens to an element. Sets both `--tu-*` (canonical) and `--tri-*`
 * (showroom shell aliases) so existing CSS continues to work.
 */
export function applyThemeToElement(element: HTMLElement, tokens: ThemeTokens): void {
  const vars = cssVariables(tokens);
  for (const [name, value] of Object.entries(vars)) {
    element.style.setProperty(name, value);
  }
  element.style.setProperty("--tri-primary", tokens.primary);
  element.style.setProperty("--tri-secondary", tokens.secondary);
  element.style.setProperty("--tri-accent", tokens.accent);
  element.style.setProperty("--tri-bg", tokens.bg);
  element.style.setProperty("--tri-surface", tokens.surface);
  element.style.setProperty("--tri-sidebar", tokens.sidebar);
  element.style.setProperty("--tri-header", tokens.header);
  element.style.setProperty("--tri-text", tokens.text);
  element.style.setProperty("--tri-muted", tokens.muted);
  element.style.setProperty("--tri-border", tokens.border);
  element.style.setProperty("--tri-success", tokens.success);
  element.style.setProperty("--tri-warning", tokens.warning);
  element.style.setProperty("--tri-error", tokens.danger);
  element.style.setProperty("--tri-focus", tokens.focus);
}

/** @deprecated Prefer brandTheme */
export const TRIUNDER_BRAND_LIGHT = brandTheme.light;
/** @deprecated Prefer brandTheme */
export const TRIUNDER_BRAND_DARK = brandTheme.dark;

