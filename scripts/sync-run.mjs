/** Run independent sources and retain a structured outcome even when a script crashes. */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const reportPath = new URL("../.sync-report.md", import.meta.url);
writeFileSync(reportPath, "");
const structuredPath = new URL("../.sync-report.json", import.meta.url);
writeFileSync(structuredPath, "[]\n");
const outcomes = [];
for (const script of ["sync-modelgo.mjs", "sync-fx.mjs", "sync-appstore.mjs", "watch-sources.mjs"]) {
  const result = spawnSync(process.execPath, [new URL(script, import.meta.url).pathname], { encoding: "utf8", timeout: 600_000, maxBuffer: 4 * 1024 * 1024 });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  outcomes.push({ source: script, attemptedAt: new Date().toISOString(), success: result.status === 0, exitCode: result.status, error: result.error?.message ?? null, output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`.slice(-12000) });
}
const details = existsSync(reportPath) ? readFileSync(reportPath, "utf8") : "";
const observations = JSON.parse(readFileSync(structuredPath, "utf8"));
writeFileSync(structuredPath, JSON.stringify({ outcomes, observations, details }, null, 2) + "\n");
const failures = outcomes.filter((outcome) => !outcome.success);
writeFileSync(reportPath, failures.length || details.trim() ? `Automated source checks require review.\n\n${failures.map((outcome) => `- ${outcome.source} failed: ${outcome.error ?? `exit ${outcome.exitCode}`}`).join("\n")}\n\n${details}` : "");
// Source failures preserve their snapshots; downstream validation decides whether publication is safe.
