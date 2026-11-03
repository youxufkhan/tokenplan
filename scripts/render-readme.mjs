/** Generate README tables from the source data. */
import { readFileSync, writeFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const plans = JSON.parse(read("../data/plans.json"));
const apiPrices = JSON.parse(read("../data/api-prices.json"));
const rankings = JSON.parse(read("../data/rankings.json"));

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 6,
});
const money = (amount, digits = 6) =>
  amount == null ? "—" : usd.format(Number(amount.toFixed(digits)));
const period = { month: "/mo", quarter: "/quarter", year: "/yr", week: "/wk", none: "" };
const priceCell = (p) => {
  const base = `${money(p.price.amount, 2)}${period[p.price.period] ?? ""}`;
  const first =
    p.price.firstPeriodAmount != null
      ? ` <sub>First period ${money(p.price.firstPeriodAmount, 2)}</sub>`
      : "";
  return base + first;
};
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|");

function plansTable(region) {
  const rows = plans.filter((p) => p.region === region);
  return [
    "| Plan | Provider | Price (USD) | Quota | Models | Multimodal | Buy | Source |",
    "|---|---|---|---|---|---|---|---|",
    ...rows.map(
      (p) =>
        `| **${esc(p.name)}** | ${esc(p.vendor)} | ${priceCell(p)} | ${esc(p.quota)} | ${esc(
          (p.models ?? []).join(", ") || "—",
        )} | ${p.multimodal === null ? "—" : p.multimodal ? "✅" : "❌"} | [Open](${p.buyUrl}) | [Official](${p.sourceUrl}) |`,
    ),
  ].join("\n");
}

function apiTable(region) {
  const rows = apiPrices.filter((a) => a.region === region);
  return [
    "| Model | Provider | Input / 1M | Output / 1M | Cache hit | Context | Access | Source |",
    "|---|---|---:|---:|---:|---|---|---|",
    ...rows.map(
      (a) =>
        `| **${esc(a.model)}** | ${esc(a.vendor)} | ${money(a.input)} | ${money(
          a.output,
        )} | ${a.cacheHit == null ? "—" : money(a.cacheHit)} | ${esc(
          a.context ?? "—",
        )} | [Open](${a.buyUrl}) | [Official](${a.sourceUrl}) |`,
    ),
  ].join("\n");
}

function rankingTable(models, limit = 12) {
  return [
    "| # | Model | Provider | Agentic Index | Cost per task | Output TPS | Weights | API rates (input/output, $/1M) |",
    "|---:|---|---|---:|---:|---:|---|---|",
    ...models.slice(0, limit).map(
      (m, i) =>
        `| ${i + 1} | ${esc(m.model)} | ${esc(m.creator)} | ${m.agenticIndex ?? "—"} | ${
          m.costPerTaskUsd != null ? `$${m.costPerTaskUsd}` : "—"
        } | ${m.outputTps ?? "—"} | ${m.openWeights ? "Open weights" : "Closed weights"} | ${
          m.priceUsdPer1M
            ? `${money(m.priceUsdPer1M.input)} / ${money(m.priceUsdPer1M.output)}`
            : "—"
        } |`,
    ),
  ].join("\n");
}

const templates = {
  "plans:global": plansTable("global"),
  "api:global": apiTable("global"),
  "rank:overall": rankingTable(rankings.highlights.topOverall.map((name) => rankings.models.find((m) => m.model === name) ?? { model: name })),
  "rank:open": rankingTable(rankings.highlights.topOpenWeights.map((name) => rankings.models.find((m) => m.model === name) ?? { model: name })),
  "rank:value": rankingTable(rankings.highlights.bestValue.map((name) => rankings.models.find((m) => m.model === name) ?? { model: name })),
  "meta:snapshotDate": rankings.snapshotDate,
  "meta:valueMinIndex": String(rankings.valueMinIndex ?? 40),
  "meta:plansCount": String(plans.length),
  "meta:apiCount": String(apiPrices.length),
  "meta:modelsCount": String(rankings.models.length),
  "meta:verifiedAt": [...new Set([...plans, ...apiPrices].map((x) => x.verifiedAt))].sort().pop() ?? "",
};

let out = read("../README.template.md");
const missing = [];
out = out.replace(/<!--\s*data:([a-zA-Z]+:[a-zA-Z]+)\s*-->/g, (_, key) => {
  if (!(key in templates)) {
    missing.push(key);
    return `<!-- Missing: ${key} -->`;
  }
  return templates[key];
});
if (missing.length) {
  console.error(`Unknown template placeholders: ${missing.join(", ")}`);
  process.exit(1);
}
writeFileSync(new URL("../README.md", import.meta.url), out);
console.log(`Generated README.md with ${plans.length} plans and ${apiPrices.length} API prices`);
