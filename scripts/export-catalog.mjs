import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

/**
 * The TypeScript registries are the source of truth. This script writes the
 * JSON copy the Go API loads, so industry and solution checks do not drift
 * into a second hand-maintained list. `catalog:check` and the registry test
 * both compare this file with the live registries.
 */
const source = readFileSync(
  new URL("../packages/solution-registry/src/catalog.ts", import.meta.url),
  "utf8",
);
const compatibilityBlock = source.match(/export const compatibility:[\s\S]*?= (\{[\s\S]*?\n\});/);
if (!compatibilityBlock) throw new Error("compatibility block not found");
const compatibility = Function(`"use strict"; return (${compatibilityBlock[1]});`)();
const solutions = [...source.matchAll(/solution\("([a-z0-9-]+)"/g)].map((match) => match[1]);

const content = readFileSync(
  new URL("../packages/industry-registry/src/content.ts", import.meta.url),
  "utf8",
);
const featuredBlock = content.match(/export const defaultFeatured[\s\S]*?= (\[[\s\S]*?\]);/);
if (!featuredBlock) throw new Error("featured block not found");
const featured = Function(`"use strict"; return (${featuredBlock[1]});`)();

const catalog = {
  industries: Object.keys(compatibility),
  solutions,
  compatibility,
  featured,
};

const destination = new URL("../apps/api/internal/catalog/catalog.json", import.meta.url);
mkdirSync(new URL("../apps/api/internal/catalog/", import.meta.url), { recursive: true });
writeFileSync(destination, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(
  `catalog: ${catalog.industries.length} industries, ${solutions.length} solutions, ${Object.values(compatibility).reduce((sum, items) => sum + items.length, 0)} pairs`,
);
