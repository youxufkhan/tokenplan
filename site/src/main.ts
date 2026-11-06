import "./styles/app.css";
import { h } from "./ui/dom";
import { renderHeader } from "./ui/header";
import { renderLadder, renderPicks } from "./ui/ladder";
import { renderPlans } from "./ui/plans";
import { renderCompare } from "./ui/compare";
import { renderApi } from "./ui/api";
import { renderScatter } from "./ui/scatter";
import { renderProviders } from "./ui/providers";
import { MARKETS, makeFormatters, quoteText, type Ctx, type Market, type Quote } from "./ui/ctx";
import { shortDate } from "./ui/format";
import { ABOUT, METHOD, METHOD_TITLE, heading, latest, lede, longDate } from "./copy";
import type { PlatformsFile, RawApi, RawPlan, UsdPlan, UsdView } from "./types";

interface Markets { fx: { rates: Record<string, number>; date: string; sourceUrl: string }; quotes: Quote[] }

async function load<T>(name: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`, { signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error(`Could not load ${name} (HTTP ${response.status})`);
  return response.json();
}

const section = (id: string, title: string, intro: string | Node, body: Node) =>
  h("section", { id, class: "section wrap" }, [h("header", { class: "section__head" }, [h("h2", null, title), h("p", null, intro)]), body]);

async function mount(app: HTMLElement) {
  const [view, rawPlans, rawApi, platforms, markets] = await Promise.all([
    load<UsdView>("usd"), load<RawPlan[]>("plans"), load<RawApi[]>("api-prices"), load<PlatformsFile>("platforms"), load<Markets>("markets"),
  ]);
  // Market pages live at /pk/, /ae/ and /sa/; ?market= is kept for old links.
  const asked = (location.pathname.match(/^\/(pk|ae|sa)\//)?.[1] ?? new URLSearchParams(location.search).get("market") ?? "").toUpperCase();
  const market: Market = asked in MARKETS ? (asked as Market) : "US";
  const currency = MARKETS[market].currency;
  const rate = currency === "USD" ? 1 : markets.fx.rates[currency];
  const raw = new Map(rawPlans.map((p) => [p.id, p]));
  const plans: UsdPlan[] = view.plans.map((p) => {
    const r = raw.get(p.id);
    return { ...p, quota: r?.quota, models: r?.models, buyUrl: r?.buyUrl, sourceUrl: r?.sourceUrl, verifiedAt: r?.verifiedAt, priceVerifiedAt: r?.priceVerifiedAt, notes: r?.notes, multimodal: r?.multimodal, priceNote: r?.price?.note, creditText: r?.includedCredit?.text };
  });
  const apiRaw = new Map(rawApi.map((a) => [a.id, a]));
  const ctx: Ctx = {
    market, currency, rate, rateDate: markets.fx.date,
    ...makeFormatters(currency, rate),
    fmtQuote: quoteText,
    premium: (q, list) => (list ? Math.round(((q.amount / (q.currency === "USD" ? 1 : markets.fx.rates[q.currency])) / list - 1) * 100) : null),
    plans, api: view.api.map((a) => ({ ...a, sourceUrl: apiRaw.get(a.id)?.sourceUrl, priceVerifiedAt: apiRaw.get(a.id)?.priceVerifiedAt, verifiedAt: apiRaw.get(a.id)?.verifiedAt })), models: view.models, platforms,
    quotes: new Map(markets.quotes.filter((q) => q.market === market).map((q) => [q.planId, q])),
  };

  const live = plans.filter((p) => p.status === "active" || p.status === "sold-out-daily");
  const vendors = new Set(live.map((p) => p.vendor)).size;
  const rankings = await load<{ snapshotDate: string }>("rankings");
  const fxStale = Date.now() - Date.parse(markets.fx.date) > 7 * 86400000;
  const fxNote = currency === "USD"
    ? "Prices are published USD list prices. App Store prices can differ from web checkout."
    : `${MARKETS[market].label.split(" · ")[0]} view: list prices converted at 1 USD = ${currency} ${rate} (${shortDate(markets.fx.date)}). The App Store column is the price recorded in that storefront, with its difference from the converted list price.`;

  const hero = h("section", { id: "top", class: "hero wrap" }, [
    h("div", { class: "hero__copy" }, [
      h("h1", null, heading(market)),
      h("p", null, `${lede(live.length, vendors)} Prices last checked ${longDate(latest([...rawPlans.map((p) => p.priceVerifiedAt ?? p.verifiedAt), markets.fx.date]))}. Pick any dots to compare plans side by side.`),
    ]),
    renderLadder(ctx),
    renderPicks(ctx),
  ]);

  app.replaceChildren(
    h("a", { class: "skip", href: "#plans" }, "Skip to plans"),
    renderHeader(market),
    ...(fxStale ? [h("p", { class: "wrap", role: "status" }, "Exchange rates are over seven days old. Converted estimates may be outdated.")] : []),
    h("main", null, [
      hero,
      section("plans", "Compare plans", fxNote, renderPlans(ctx)),
      section("api", "API rates per token", "Calling models directly costs by the token. Set a month of usage and every model is priced for it.", renderApi(ctx, rawApi)),
      section("models", "Benchmark score against cost", "Agentic Index scores how well a model completes multi-step coding and tool tasks. Cost per task is what the benchmark run cost. Better models sit higher, cheaper ones further left.", renderScatter(ctx.models)),
      section("method", METHOD_TITLE, METHOD[0], h("div", { class: "method" }, [...METHOD.slice(1).map((t) => h("p", null, t)), h("p", null, ABOUT)])),
      section("providers", "Providers", "Who sells the plans and APIs above, and whether that is the model maker, a cloud platform or a reseller.", renderProviders(platforms, plans, ctx.api)),
    ]),
    renderCompare(ctx),
    h("footer", { class: "foot" }, h("div", { class: "wrap foot__in" }, [
      h("div", { class: "support" }, [
        h("p", null, "Built by Yousuf Khan. If this helps you choose a plan, you can support the project or star it on GitHub."),
        h("nav", { class: "support__links", "aria-label": "Creator and project links" }, [
          h("a", { href: "https://www.patreon.com/c/youxufkhan", target: "_blank", rel: "noopener noreferrer", class: "btn btn--solid" }, "Support on Patreon"),
          h("a", { href: "https://github.com/youxufkhan/tokenplan", target: "_blank", rel: "noopener noreferrer", class: "btn" }, "Star on GitHub"),
          h("a", { href: "https://github.com/youxufkhan", target: "_blank", rel: "noopener noreferrer" }, "GitHub profile"),
          h("a", { href: "https://yousufkhan.uk", target: "_blank", rel: "noopener noreferrer" }, "Personal website"),
        ]),
      ]),
      h("p", null, `See each quote for its review and price verification dates. Benchmark data: Artificial Analysis via ModelGo, snapshot ${shortDate(rankings.snapshotDate)}.`),
      h("p", null, [h("a", { href: "https://github.com/supercli-site/awesome-coding-plan" }, "Adapted from Awesome Coding Plan"), " · CC BY 4.0 · ", h("a", { href: markets.fx.sourceUrl }, "Exchange rates"), "."]),
    ])),
  );
}

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing application root");
mount(app).then(() => { if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView(); }).catch((error: unknown) => {
  const retry = h("button", { type: "button", class: "btn" }, "Reload");
  retry.addEventListener("click", () => location.reload());
  app.replaceChildren(h("div", { class: "wrap error", role: "alert" }, [h("h1", null, "Could not load pricing data"), h("p", null, error instanceof Error ? error.message : String(error)), retry]));
});
