import "./styles/app.css";
import { h } from "./ui/dom";
import { renderHeader } from "./ui/header";
import { renderLadder, renderPicks } from "./ui/ladder";
import { renderPlans } from "./ui/plans";
import { renderCompare } from "./ui/compare";
import { renderApi } from "./ui/api";
import { renderScatter } from "./ui/scatter";
import { renderProviders } from "./ui/providers";
import { makeFormatters, type Ctx, type Quote } from "./ui/ctx";
import { shortDate } from "./ui/format";
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
  const market = new URLSearchParams(location.search).get("market") === "pk" ? "PK" : "US";
  const rate = markets.fx.rates.PKR;
  const raw = new Map(rawPlans.map((p) => [p.id, p]));
  const plans: UsdPlan[] = view.plans.map((p) => {
    const r = raw.get(p.id);
    return { ...p, quota: r?.quota, models: r?.models, buyUrl: r?.buyUrl, sourceUrl: r?.sourceUrl, verifiedAt: r?.verifiedAt, notes: r?.notes, multimodal: r?.multimodal, priceNote: r?.price?.note, creditText: r?.includedCredit?.text };
  });
  const apiRaw = new Map(rawApi.map((a) => [a.id, a]));
  const ctx: Ctx = {
    market, currency: market === "PK" ? "PKR" : "USD", rate, rateDate: markets.fx.date,
    ...makeFormatters(market, rate),
    plans, api: view.api.map((a) => ({ ...a, sourceUrl: apiRaw.get(a.id)?.sourceUrl, verifiedAt: apiRaw.get(a.id)?.verifiedAt })), models: view.models, platforms,
    quotes: new Map(markets.quotes.filter((q) => q.market === market).map((q) => [q.planId, q])),
  };

  const live = plans.filter((p) => p.status === "active" || p.status === "sold-out-daily");
  const vendors = new Set(live.map((p) => p.vendor)).size;
  const newest = [...plans, ...ctx.api].map((x) => x.verifiedAt ?? "").sort().pop();
  const fxNote = market === "PK"
    ? `Pakistan view: prices converted at 1 USD = PKR ${rate} (${shortDate(markets.fx.date)}). Where we recorded the local App Store price, it is shown next to the converted list price.`
    : "Prices are published USD list prices. App Store prices can differ from web checkout.";

  const hero = h("section", { id: "top", class: "hero wrap" }, [
    h("div", { class: "hero__copy" }, [
      h("h1", null, "Monthly prices of every AI coding plan, on one line"),
      h("p", null, `${live.length} subscriptions from ${vendors} providers. Pick any dots to compare plans side by side.`),
    ]),
    renderLadder(ctx),
    renderPicks(ctx),
  ]);

  app.append(
    h("a", { class: "skip", href: "#plans" }, "Skip to plans"),
    renderHeader(market),
    h("main", null, [
      hero,
      section("plans", "Compare plans", fxNote, renderPlans(ctx)),
      section("api", "API rates per token", "Calling models directly costs by the token. Set a month of usage and every model is priced for it.", renderApi(ctx, rawApi)),
      section("models", "Benchmark score against cost", "Agentic Index scores how well a model completes multi-step coding and tool tasks. Cost per task is what the benchmark run cost. Better models sit higher, cheaper ones further left.", renderScatter(ctx.models)),
      section("providers", "Providers", "Who sells the plans and APIs above, and whether that is the model maker, a cloud platform or a reseller.", renderProviders(platforms, plans, ctx.api)),
    ]),
    renderCompare(ctx),
    h("footer", { class: "foot" }, h("div", { class: "wrap foot__in" }, [
      h("p", null, `Every price links to its official page. Data last re-checked ${shortDate(newest)}. Benchmark data: Artificial Analysis via ModelGo, snapshot refreshed daily.`),
      h("p", null, [h("a", { href: "https://github.com/supercli-site/awesome-coding-plan" }, "Adapted from Awesome Coding Plan"), " · CC BY 4.0 · ", h("a", { href: markets.fx.sourceUrl }, "Exchange rates"), "."]),
    ])),
  );
}

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing application root");
mount(app).then(() => { if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView(); }).catch((error: unknown) => {
  const retry = h("button", { type: "button", class: "btn" }, "Reload");
  retry.addEventListener("click", () => location.reload());
  app.append(h("div", { class: "wrap error", role: "alert" }, [h("h1", null, "Could not load pricing data"), h("p", null, error instanceof Error ? error.message : String(error)), retry]));
});
