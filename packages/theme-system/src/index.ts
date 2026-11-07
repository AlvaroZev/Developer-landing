/**
 * @triunder/theme-system
 *
 * Owns brand tokens, industry tokens, CSS variable mapping, and contrast checks.
 * Adding a palette means adding one IndustryTheme here and pointing an industry
 * slug at it. Do not add industry color conditionals in components.
 */
export { contrastRatio, luminance } from "./contrast";
export { cssVarStyle, themeToCssVars } from "./css";
export { brandTheme, industryThemeIds, industryThemes } from "./themes";
export { TOKEN_KEYS, type IndustryTheme, type ThemeTokens } from "./types";
