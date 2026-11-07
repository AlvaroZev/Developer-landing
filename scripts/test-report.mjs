import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

/**
 * Runs the catalog check, the Go tests, and the workspace tests, then writes
 * docs/test-report.json from their exit codes. A failed command is recorded as
 * failed. This file is generated output and is not a claim that tests passed.
 */
const catalog = JSON.parse(
  readFileSync(new URL("../apps/api/internal/catalog/catalog.json", import.meta.url), "utf8"),
);
const pairs = Object.values(catalog.compatibility).reduce((sum, items) => sum + items.length, 0);
const steps = [
  ["node", ["scripts/check-catalog.mjs"]],
  ["go", ["test", "./apps/api/..."]],
  ["pnpm", ["test"]],
];

const results = [];
for (const [command, args] of steps) {
  const started = Date.now();
  const child = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  results.push({
    command: [command, ...args].join(" "),
    exitCode: child.status,
    ms: Date.now() - started,
  });
  if (child.status !== 0) break;
}

const report = {
  generatedAt: new Date().toISOString(),
  industries: catalog.industries.length,
  solutions: catalog.solutions.length,
  pairs,
  results,
  passed: results.every((item) => item.exitCode === 0),
};
writeFileSync(
  new URL("../docs/test-report.json", import.meta.url),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
