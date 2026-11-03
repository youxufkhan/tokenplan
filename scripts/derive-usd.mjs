/** Derive a USD comparison snapshot from source prices, rankings and the recorded FX rate. */
import { readFileSync, writeFileSync } from "node:fs";
import { round } from "./currency.mjs";

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const plans = read("plans.json");
const platforms = read("platforms.json");
const PLATFORM = Object.fromEntries(platforms.platforms.map((p) => [p.id, p]));
const api = read("api-prices.json");
const rankings = read("rankings.json");

const BLEND = { input: 3, output: 1 };
const price = (value, digits = 6) => value == null ? null : round(value, digits);
const perMonth = { month: 1, quarter: 1 / 3, year: 1 / 12, week: 52 / 12, none: null };

const planRows = plans.map((p) => {
  const factor = perMonth[p.price.period];
  const monthly = p.price.amount == null || factor == null ? null : price(p.price.amount * factor);
  const credit = p.includedCredit?.amount != null ? price(p.includedCredit.amount) : null;
  return {
    id: p.id,
    vendor: p.vendor,
    name: p.name,
    region: p.region,
    kind: p.kind,
    originalCurrency: p.price.currency,
    monthlyUsd: monthly,
    firstPeriodUsd: price(p.price.firstPeriodAmount ?? null),
    includedCreditUsd: credit,
    // A ratio above 1 means included credit exceeds the monthly fee.
    creditRatio: monthly && credit ? round(credit / monthly) : null,
    confidence: p.confidence,
    status: p.status,
    platformId: p.platformId ?? null,
    offering: PLATFORM[p.platformId ?? ""]?.offering ?? null,
    offeringLabel: PLATFORM[p.platformId ?? ""]?.offering ? platforms.offeringDefs[PLATFORM[p.platformId].offering].label : null,
    bundle: PLATFORM[p.platformId ?? ""]?.bundle ?? null,
    bundleLabel: PLATFORM[p.platformId ?? ""]?.bundle ? platforms.bundleDefs[PLATFORM[p.platformId].bundle].label : null,
    platformUrl: PLATFORM[p.platformId ?? ""]?.url ?? null,
  };
});

const apiRows = api.map((a) => {
  const input = price(a.input);
  const output = price(a.output);
  return {
    id: a.id,
    vendor: a.vendor,
    model: a.model,
    region: a.region,
    originalCurrency: a.currency,
    inputUsd: input,
    outputUsd: output,
    cacheHitUsd: price(a.cacheHit ?? null),
    blendedUsd: round((input * BLEND.input + output * BLEND.output) / (BLEND.input + BLEND.output), 6),
    confidence: a.confidence,
    platformId: a.platformId ?? null,
    offering: PLATFORM[a.platformId ?? ""]?.offering ?? null,
    offeringLabel: PLATFORM[a.platformId ?? ""]?.offering ? platforms.offeringDefs[PLATFORM[a.platformId].offering].label : null,
    platformUrl: PLATFORM[a.platformId ?? ""]?.url ?? null,
  };
});

const minIndex = rankings.valueMinIndex ?? 40;
const rankRows = rankings.models
  .filter((m) => m.costPerTaskUsd != null)
  .map((m) => {
    const cost = price(m.costPerTaskUsd);
    return {
      model: m.model,
      creator: m.creator,
      openWeights: m.openWeights,
      agenticIndex: m.agenticIndex,
      costPerTaskUsd: cost,
      valuePerUsd: m.agenticIndex != null && cost ? round(m.agenticIndex / cost, 1) : null,
      inputUsd: price(m.priceUsdPer1M?.input ?? null),
      outputUsd: price(m.priceUsdPer1M?.output ?? null),
    };
  });

// Require at least partial verification for price highlights.
const trusted = (x) => x.confidence !== "low";
const paidPlans = planRows.filter((p) => trusted(p) && p.monthlyUsd > 0 && p.status !== "discontinued");
const byAsc = (k) => (a, b) => a[k] - b[k];
const pickIds = (arr, n = 5) => arr.slice(0, n).map((x) => x.id ?? x.model);

const out = {
  method: {
    planMonthly: "Annual prices divided by 12, quarterly prices by 3, and weekly prices multiplied by 52/12. Rankings use regular prices.",
    apiBlended: `Weights uncached input and output ${BLEND.input}:${BLEND.output}, in USD per million tokens.`,
    value: `Agentic Index ÷ USD cost per task. Models need an Agentic Index of at least ${minIndex}.`,
    excluded: "Price highlights require at least partial verification. Model value requires a qualifying score and a positive task cost.",
  },
  highlights: {
    plans: {
      cheapest: pickIds([...paidPlans].sort(byAsc("monthlyUsd"))),
      priciest: pickIds([...paidPlans].sort(byAsc("monthlyUsd")).reverse()),
      mostCredit: pickIds(paidPlans.filter((p) => p.creditRatio).sort((a, b) => b.creditRatio - a.creditRatio)),
    },
    api: {
      cheapest: pickIds(apiRows.filter(trusted).sort(byAsc("blendedUsd"))),
      priciest: pickIds(apiRows.filter(trusted).sort(byAsc("blendedUsd")).reverse()),
    },
    models: {
      bestValue: pickIds(
        rankRows.filter((m) => (m.agenticIndex ?? 0) >= minIndex && m.valuePerUsd).sort((a, b) => b.valuePerUsd - a.valuePerUsd),
      ),
      cheapestPerTask: pickIds(rankRows.filter((m) => (m.agenticIndex ?? 0) >= minIndex).sort(byAsc("costPerTaskUsd"))),
    },
  },
  plans: planRows,
  api: apiRows,
  models: rankRows,
};

writeFileSync(new URL("../data/usd.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`Generated USD catalog · Plans ${planRows.length} · API ${apiRows.length} · Models ${rankRows.length}`);
