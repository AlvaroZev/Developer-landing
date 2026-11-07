import { describe, expect, it } from "vitest";
import { en, es, formatMoney, translate } from "./index";

function leaves(tree: unknown, prefix = ""): string[] {
  if (typeof tree === "string") return [prefix.slice(0, -1)];
  if (!tree || typeof tree !== "object") return [];
  return Object.entries(tree).flatMap(([key, value]) => leaves(value, `${prefix}${key}.`));
}

describe("i18n", () => {
  it("gives Spanish every English key", () => {
    const english = leaves(en).sort();
    const spanish = leaves(es).sort();
    expect(spanish).toEqual(english);
  });

  it("does not leave Spanish values empty", () => {
    for (const path of leaves(es)) {
      const value = path.split(".").reduce<unknown>((current, key) => {
        return (current as Record<string, unknown>)[key];
      }, es);
      expect(String(value).trim().length, path).toBeGreaterThan(0);
    }
  });

  it("translates and formats currency", () => {
    expect(translate("es", "home.cta")).toBe("Explorar esta solución");
    expect(formatMoney("en", 1250, "USD")).toContain("1,250");
  });
});
