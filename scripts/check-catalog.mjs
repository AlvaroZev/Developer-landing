import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

/**
 * Confirms the committed JSON catalog is internally consistent, then regenerates
 * it from the TypeScript registries and fails if the two copies differ.
 * The script does not invent a pass; a mismatch exits non-zero.
 */
const file = new URL("../apps/api/internal/catalog/catalog.json", import.meta.url);
const committed = JSON.parse(readFileSync(file, "utf8"));

if (committed.industries.length !== 20)
  throw new Error(`expected 20 industries, got ${committed.industries.length}`);
if (!committed.industries.includes("custom")) throw new Error("custom industry missing");
if ((committed.compatibility.custom ?? []).length !== 0)
  throw new Error("custom industry must not have demos");
if (new Set(committed.solutions).size !== committed.solutions.length)
  throw new Error("duplicate solution slug");
for (const solution of committed.solutions) {
  const used = Object.values(committed.compatibility).some((items) => items.includes(solution));
  if (!used) throw new Error(`solution ${solution} is not used`);
}
for (const [industry, solutions] of Object.entries(committed.compatibility)) {
  if (!committed.industries.includes(industry)) throw new Error(`unknown industry ${industry}`);
  if (new Set(solutions).size !== solutions.length)
    throw new Error(`duplicate pair in ${industry}`);
  for (const solution of solutions) {
    if (!committed.solutions.includes(solution))
      throw new Error(`unknown solution ${solution} on ${industry}`);
  }
}

const exported = spawnSync(process.execPath, [new URL("./export-catalog.mjs", import.meta.url)], {
  encoding: "utf8",
});
if (exported.status !== 0) {
  console.error(exported.stderr || exported.stdout);
  process.exit(exported.status ?? 1);
}
const fresh = JSON.parse(readFileSync(file, "utf8"));
if (JSON.stringify(fresh) !== JSON.stringify(committed)) {
  throw new Error(
    "catalog.json drifted from the TypeScript registries. Run node scripts/export-catalog.mjs and commit the result.",
  );
}
console.log("catalog.json matches the registries");
