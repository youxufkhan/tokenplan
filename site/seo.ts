/** Build-time prerender: crawlable head tags, plan/API tables and method copy for each market page, plus sitemap and llms-full.txt. */
import { readFileSync } from "node:fs";
import { MARKETS, makeFormatters, quoteText, groupQuotes, type Market, type Quote } from "./src/ui/ctx";
import { ABOUT, COUNTRY, LANG, METHOD, METHOD_TITLE, PATH, SITE, heading, latest, lede, longDate } from "./src/copy";
import type { RawApi, RawPlan, UsdView } from "./src/types";

const read = <T>(name: string): T => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export const MARKET_LIST = Object.keys(MARKETS) as Market[];

function load() {
  const view = read<UsdView>("usd.json");
  const raw = new Map(read<RawPlan[]>("plans.json").map((p) => [p.id, p]));
  const rawApi = new Map(read<RawApi[]>("api-prices.json").map((a) => [a.id, a]));
  const markets = read<{ fx: { rates: Record<string, number>; date: string }; quotes: Quote[] }>("markets.json");
  const live = view.plans.filter((p) => p.status === "active" || p.status === "sold-out-daily")
    .sort((a, b) => (a.monthlyUsd ?? 1e9) - (b.monthlyUsd ?? 1e9) || a.name.localeCompare(b.name));
  const api = [...view.api].sort((a, b) => a.blendedUsd - b.blendedUsd);
  const checked = latest([...[...raw.values()].map((p) => p.priceVerifiedAt ?? p.verifiedAt), markets.fx.date]);
  return { view, raw, rawApi, markets, live, api, checked, vendors: new Set(live.map((p) => p.vendor)).size };
}

const title = (m: Market) => m === "US"
  ? "AI Coding Plan Prices Compared: Claude, ChatGPT, Cursor, Copilot"
  : `AI Coding Plan Prices in ${COUNTRY[m].replace(/^the /, "")} (${MARKETS[m].currency}): Claude, ChatGPT, Cursor`;
const description = (m: Market) => m === "US"
  ? "Compare monthly prices of AI coding plans and API token rates: Claude, ChatGPT, Cursor, GitHub Copilot, Gemini and more, each linked to its official source and checked daily."
  : `AI coding plan prices in ${MARKETS[m].currency} for ${COUNTRY[m]}: Claude, ChatGPT, Cursor, Copilot and more, with local App Store prices, official sources and daily checks.`;

function head(m: Market, d: ReturnType<typeof load>) {
  const url = `${SITE}${PATH[m]}`;
  const author = `${SITE}/#author`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Person", "@id": author, name: "Yousuf Khan", url: "https://yousufkhan.uk", sameAs: ["https://github.com/youxufkhan", "https://www.patreon.com/c/youxufkhan"] },
      { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: "AI Plan Pricing", description: "AI coding subscription and API price comparison", inLanguage: "en", publisher: { "@id": author } },
      { "@type": "WebPage", "@id": `${url}#webpage`, url, name: title(m), description: description(m), inLanguage: LANG[m], isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#dataset` }, dateModified: d.checked, author: { "@id": author } },
      { "@type": "WebApplication", "@id": `${SITE}/#app`, name: "AI Plan Pricing", url: `${SITE}/`, applicationCategory: "BusinessApplication", operatingSystem: "Any", isAccessibleForFree: true, offers: { "@type": "Offer", price: 0, priceCurrency: "USD" }, author: { "@id": author } },
      {
        "@type": "Dataset", "@id": `${SITE}/#dataset`, name: "AI coding plan and API price dataset",
        description: "Monthly prices, quotas and included credit for AI coding subscriptions, plus input, output and cache rates for AI model APIs. Each record links to its official pricing source and carries its verification date. Local App Store quotes and reference exchange rates cover the US, Pakistan, UAE and Saudi Arabia.",
        url: `${SITE}/`, license: "https://creativecommons.org/licenses/by/4.0/", creator: { "@id": author }, isAccessibleForFree: true, dateModified: d.checked,
        distribution: ["plans", "api-prices", "markets"].map((f) => ({ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${SITE}/data/${f}.json` })),
      },
    ],
  };
  const alt = MARKET_LIST.map((x) => `<link rel="alternate" hreflang="${LANG[x].toLowerCase()}" href="${SITE}${PATH[x]}" />`).join("\n    ");
  return `<title>${esc(title(m))}</title>
    <meta name="description" content="${esc(description(m))}" />
    <link rel="canonical" href="${url}" />
    ${alt}
    <link rel="alternate" hreflang="x-default" href="${SITE}/" />
    <link rel="alternate" type="text/markdown" href="${SITE}/llms-full.txt" title="Prices as Markdown" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="AI Plan Pricing" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(title(m))}" />
    <meta property="og:description" content="${esc(description(m))}" />
    <meta property="og:image" content="${SITE}/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="AI Plan Pricing: AI coding plan prices compared" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title(m))}" />
    <meta name="twitter:description" content="${esc(description(m))}" />
    <meta name="twitter:image" content="${SITE}/og.png" />
    <script type="application/ld+json">${JSON.stringify(graph).replace(/</g, "\\u003c")}</script>`;
}

function body(m: Market, d: ReturnType<typeof load>) {
  const { fmt } = makeFormatters(MARKETS[m].currency, MARKETS[m].currency === "USD" ? 1 : d.markets.fx.rates[MARKETS[m].currency]);
  const quotes = groupQuotes(d.markets.quotes, m);
  const link = (text: string, url?: string | null) => url && /^https:\/\//.test(url) ? `<a href="${esc(url)}" rel="noopener">${esc(text)}</a>` : "";
  const planRows = d.live.map((p) => {
    const r = d.raw.get(p.id);
    const q = quotes.get(p.id);
    return `<tr><th scope="row">${esc(p.name)}</th><td>${esc(p.vendor)}</td><td>${p.monthlyUsd === 0 ? "Free" : esc(fmt(p.monthlyUsd)) + (r?.channel ? ` (${esc(r.channel)} reference)` : "")}</td>${`<td>${q ? q.map((offer) => esc(`${offer.channel}: ${quoteText(offer)}`)).join("<br>") : "—"}</td>`}<td>${esc([r?.quota, r?.price?.note, r?.fees].filter(Boolean).join(" "))}</td><td>${esc(r?.priceVerifiedAt ?? r?.verifiedAt ?? "")}</td><td>${link("Source", r?.sourceUrl)}</td></tr>`;
  }).join("");
  const apiRows = d.api.map((a) => `<tr><th scope="row">${esc(a.model)}</th><td>${esc(a.vendor)}</td><td>${esc(fmt(a.inputUsd))}</td><td>${esc(fmt(a.outputUsd))}</td><td>${a.cacheHitUsd == null ? "—" : esc(fmt(a.cacheHitUsd))}</td><td>${link("Source", d.rawApi.get(a.id)?.sourceUrl)}</td></tr>`).join("");
  const fxLine = MARKETS[m].currency === "USD" ? "Prices are published USD list prices." : `List prices converted at 1 USD = ${MARKETS[m].currency} ${d.markets.fx.rates[MARKETS[m].currency]} (${longDate(d.markets.fx.date)}); App Store prices are the amounts recorded in the ${COUNTRY[m]} storefront.`;
  return `<main class="prerender wrap">
      <section class="hero"><div class="hero__copy"><h1>${esc(heading(m))}</h1><p>${esc(lede(d.live.length, d.vendors))} Prices last checked ${esc(longDate(d.checked))}.</p></div></section>
      <section id="plans"><h2>Compare plans</h2><p>${esc(fxLine)}</p>
        <table><caption>Monthly price of each AI coding plan, cheapest first</caption><thead><tr><th scope="col">Plan</th><th scope="col">Provider</th><th scope="col">Monthly price</th><th scope="col">${m} offers</th><th scope="col">What you get</th><th scope="col">Price verified</th><th scope="col">Source</th></tr></thead><tbody>${planRows}</tbody></table>
      </section>
      <section id="api"><h2>API rates per token</h2><p>Price per million tokens, cheapest blended rate first.</p>
        <table><caption>AI model API prices per million tokens</caption><thead><tr><th scope="col">Model</th><th scope="col">Provider</th><th scope="col">Input</th><th scope="col">Output</th><th scope="col">Cached input</th><th scope="col">Source</th></tr></thead><tbody>${apiRows}</tbody></table>
      </section>
      <section id="method"><h2>${esc(METHOD_TITLE)}</h2>${METHOD.map((p) => `<p>${esc(p)}</p>`).join("")}<p>${esc(ABOUT)}</p></section>
    </main>`;
}

/** Fill the two markers in the built index.html for one market. */
export function renderPage(template: string, m: Market) {
  const d = load();
  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${LANG[m]}">`)
    .replace("<!--seo-head-->", head(m, d))
    .replace("<!--seo-body-->", body(m, d));
}

export function sitemap() {
  const { checked } = load();
  const urls = MARKET_LIST.map((m) => `  <url>\n    <loc>${SITE}${PATH[m]}</loc>\n    <lastmod>${checked}</lastmod>\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Full price list as Markdown for agents that do not run JavaScript. */
export function llmsFull() {
  const d = load();
  const cell = (s: unknown) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ");
  const plans = d.live.map((p) => {
    const r = d.raw.get(p.id);
    return `| ${cell(p.name)} | ${cell(p.vendor)} | ${p.monthlyUsd === 0 ? "Free" : p.monthlyUsd == null ? "—" : `$${p.monthlyUsd.toFixed(2)}`} | ${cell(r?.quota)} | ${r?.priceVerifiedAt ?? r?.verifiedAt ?? ""} | ${r?.sourceUrl ?? ""} |`;
  }).join("\n");
  const api = d.api.map((a) => `| ${cell(a.model)} | ${cell(a.vendor)} | ${a.inputUsd} | ${a.outputUsd} | ${a.cacheHitUsd ?? "—"} | ${d.rawApi.get(a.id)?.sourceUrl ?? ""} |`).join("\n");
  const quotes = d.markets.quotes.filter((q) => q.market !== "US").map((q) => `| ${q.market} | ${q.planId} | ${quoteText(q)} | ${q.channel} | ${q.verifiedAt} |`).join("\n");
  return `# AI Plan Pricing: full price list

> Monthly prices of AI coding subscriptions and per-token API rates, each linked to its official source. Prices last checked ${d.checked}. Site: ${SITE}/

## ${METHOD_TITLE}

${METHOD.join("\n\n")}

${ABOUT}

## AI coding plans (USD per month, cheapest first)

| Plan | Provider | Monthly price | What you get | Price verified | Source |
|---|---|---|---|---|---|
${plans}

## API rates (USD per million tokens, cheapest blended first)

| Model | Provider | Input | Output | Cached input | Source |
|---|---|---|---|---|---|
${api}

## Regional offers

Exchange rates on ${d.markets.fx.date}: 1 USD = ${Object.entries(d.markets.fx.rates).map(([c, r]) => `${r} ${c}`).join(", ")}.

| Market | Plan | Price | Channel | Verified |
|---|---|---|---|---|
${quotes}
`;
}
