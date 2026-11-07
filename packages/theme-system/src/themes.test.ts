import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { themeToCssVars } from "./css";
import { brandTheme, industryThemeIds, industryThemes } from "./themes";
import { TOKEN_KEYS } from "./types";

describe("theme system", () => {
  it("covers every showroom industry with a complete light and dark pair", () => {
    expect(industryThemeIds).toHaveLength(20);
    for (const id of industryThemeIds) {
      const theme = industryThemes[id];
      if (!theme) throw new Error(id);
      for (const mode of [theme.light, theme.dark] as const) {
        for (const key of TOKEN_KEYS) {
          expect(mode[key], `${id}.${key}`).toMatch(/^#[0-9a-fA-F]{6}$/);
        }
        expect(mode.chart).toHaveLength(6);
      }
    }
  });

  it("keeps button labels and body text above WCAG AA contrast", () => {
    const themes = [brandTheme, ...Object.values(industryThemes)];
    for (const theme of themes) {
      for (const mode of [theme.light, theme.dark]) {
        expect(contrastRatio(mode.button, mode.buttonText)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(mode.background, mode.text)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(mode.surface, mode.text)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(mode.background, mode.muted)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("maps tokens to stable CSS variable names", () => {
    const vars = themeToCssVars(brandTheme.light);
    expect(vars["--bg"]).toBe(brandTheme.light.background);
    expect(vars["--button-text"]).toBe(brandTheme.light.buttonText);
    expect(vars["--chart-0"]).toBe(brandTheme.light.chart[0]);
    expect(vars["--chart-5"]).toBe(brandTheme.light.chart[5]);
  });
});
