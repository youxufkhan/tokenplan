/**
 * Sync the agent model snapshot from the public ModelGo rankings (https://modelgo.ai/models/rankings/agent).
 *
 * The source is the public read-only API the page itself calls; no auth is needed:
 *   GET https://modelgo-web-api.modelgo.ai/api/v1/model-discovery/rankings
 *       ?type=AGENT&metric=<AGENTIC_INDEX|COST_PER_TASK|VALUE_SCORE|OUTPUT_TPS|USAGE>&page=&page_size=
 * Raw scores come from Artificial Analysis (Agentic Index / Cost per Task / TPS);
 * usage and API unit prices come from ModelGo. Only publicly displayed fields are kept.
 *
 * Failure policy: the API occasionally fails the SSL handshake, so each request retries 4 times;
 * a failed metric never overwrites data/rankings.json (stale beats empty).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const BASE = "https://modelgo-web-api.modelgo.ai/api/v1/model-discovery/rankings";
const OUT = new URL("../data/rankings.json", import.meta.url);
const PAGE_SIZE = 100;
const VALUE_MIN_INDEX = 40;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json", "user-agent": "awesome-coding-plan-sync/1.0" },
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      if (body.code !== 0) throw new Error(`api code ${body.code}: ${body.msg}`);
      return body.data;
    } catch (err) {
      last = err;
      await sleep(1500 * (i + 1));
    }
  }
  throw new Error(`${url} → ${last?.message}`);
}

async function fetchAll(metric) {
  const items = [];
  let snapshotDate = "";
  for (let page = 1; page < 20; page++) {
    const q = new URLSearchParams({ type: "AGENT", metric, page: String(page), page_size: String(PAGE_SIZE) });
    const data = await getJson(`${BASE}?${q}`);
    snapshotDate ||= data.snapshot_date;
    items.push(...(data.items ?? []));
    if (items.length >= data.total || !data.items?.length) break;
  }
  return { snapshotDate, items };
}

const pick = (m) => ({
  model: m.model_name,
  baseModel: m.model_base_name,
  variant: m.model_variant ?? null,
  creator: m.creator_name,
  openWeights: !!m.is_open_source,
  releaseDate: m.release_date ?? null,
  agenticIndex: m.primary_score ?? null,
  costPerTaskUsd: m.cost_value ?? null,
  outputTps: m.output_tps ?? null,
  latencyMs: m.end_to_end_latency_ms ?? null,
  valueScore: m.value_score ?? null,
  onModelGo: !!m.is_integrated,
  modelgoId: m.modelgo_id ?? null,
  markets: m.integrated_markets ?? [],
  priceUsdPer1M: m.unit_prices
    ? {
        input: m.unit_prices.input_tokens ?? null,
        output: m.unit_prices.output_tokens ?? null,
        cacheHit: m.unit_prices.cache_hit_tokens ?? null,
      }
    : null,
});

async function main() {
  const agentic = await fetchAll("AGENTIC_INDEX");
  if (!agentic.items.length) throw new Error("AGENTIC_INDEX returned 0 items; refusing to overwrite the snapshot");

  const models = agentic.items.map(pick);
  const top = (arr, n) => arr.slice(0, n).map((m) => m.model);
  const snapshot = {
    source: "https://modelgo.ai/models/rankings/agent",
    attribution: "Agentic Index / Cost per Task / TPS: Artificial Analysis; usage & unit prices: ModelGo",
    snapshotDate: agentic.snapshotDate,
    total: models.length,
    valueMinIndex: VALUE_MIN_INDEX,
    highlights: {
      topOverall: top(models, 10),
      topOpenWeights: top(models.filter((m) => m.openWeights), 10),
      // Value = Agentic Index ÷ cost per task, compared only among models above the minimum index so low-end variants do not dominate.
      bestValue: top(
        models
          .filter((m) => (m.agenticIndex ?? 0) >= VALUE_MIN_INDEX && m.valueScore != null)
          .sort((a, b) => b.valueScore - a.valueScore),
        10,
      ),
    },
    models,
  };

  const prev = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  const next = JSON.stringify(snapshot, null, 2) + "\n";
  if (prev === next) return console.log(`rankings unchanged (${snapshot.snapshotDate})`);
  writeFileSync(OUT, next);
  console.log(`rankings updated: ${snapshot.snapshotDate} · ${models.length} models`);
}

main().catch((err) => {
  console.error(`Sync failed, keeping the old snapshot: ${err.message}`);
  process.exit(1);
});
