import "./styles/tokens.css";
import "./styles/main.css";
import "./styles/market.css";
import { h } from "./ui/dom";
import { renderHeader } from "./ui/header";
import { renderEstimator } from "./ui/estimator";
import { renderApi, renderPlans, renderPlatforms, renderScatter } from "./ui/catalog";
import { money, currencyMoney } from "./ui/format";
import type { UsdView, PlatformsFile, RawApi, RawPlan } from "./types";

interface Markets {
  fx: { rates: Record<string, number>; date: string; sourceUrl: string };
  quotes: {
    market: "US" | "PK";
    planId: string;
    amount: number;
    currency: "USD" | "PKR";
    channel: string;
    sourceUrl: string;
    verifiedAt: string;
    match?: string;
  }[];
}

async function load<T>(name: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`, {
    signal: AbortSignal.timeout(4500),
  });
  if (!response.ok) throw new Error(`Could not load ${name} (HTTP ${response.status})`);
  return response.json();
}

const section = (id: string, title: string, intro: string, content: HTMLElement) =>
  h("section", { id, class: "section shell" }, [
    h("header", { class: "section__head" }, [
      h("h2", { class: "section__title" }, title),
      h("p", { class: "section__desc" }, intro),
    ]),
    content,
  ]);

async function mount(app: HTMLElement) {
  const [view, rawPlans, rawApi, platforms, markets] = await Promise.all([
    load<UsdView>("usd"), load<RawPlan[]>("plans"), load<RawApi[]>("api-prices"),
    load<PlatformsFile>("platforms"), load<Markets>("markets"),
  ]);
  const market = new URLSearchParams(location.search).get("market") === "pk" ? "PK" : "US";
  const pk = market === "PK";
  const quoteRows = markets.quotes.filter((quote) => quote.market === market);
  const referenceMoney = pk
    ? (amount: number | null | undefined) => amount == null ? "—" : `≈ ${currencyMoney(amount * markets.fx.rates.PKR, "PKR")}`
    : money;
  const hero = h("section", { id: "market", class: "market" }, [
    h("div", { class: "shell market__layout" }, [
      h("div", { class: "market__copy" }, [
        h("h1", null, "The price of AI coding."),
        h("p", null, "Compare local subscriptions, API rates and model performance before you pay."),
        h("a", { class: "market__jump", href: "#plans" }, "Browse subscriptions ↓"),
      ]),
      h("div", { class: "market__sheet" }, [
        h("nav", { class: "market__tabs", "aria-label": "Pricing market" }, [
          h("a", { href: "?market=us", "aria-current": pk ? "false" : "page" }, "United States / USD"),
          h("a", { href: "?market=pk", "aria-current": pk ? "page" : "false" }, "Pakistan / PKR"),
        ]),
        h("h2", null, "Local subscription prices"),
        h("p", { class: "market__sub" }, "Published App Store prices per month"),
        ...quoteRows.map((quote) => {
          const plan = view.plans.find((item) => item.id === quote.planId);
          return h("div", { class: "market__quote" }, [
            h("div", null, [
              h("strong", null, plan?.name ?? quote.planId),
              h("a", { href: quote.sourceUrl, target: "_blank", rel: "noopener noreferrer" }, quote.channel),
            ]),
            h("div", { class: "market__number" }, [
              h("strong", null, currencyMoney(quote.amount, quote.currency)),
              h("span", null, `Checked ${quote.verifiedAt}`),
            ]),
          ]);
        }),
        h("p", { class: "market__sub" }, "Web checkout may show a different price."),
      ]),
    ]),
  ]);
  const method = h("div", { class: "method" }, [
    ["Monthly equivalents", view.method.planMonthly],
    ["Blended API price", view.method.apiBlended],
    ["Model value", view.method.value],
  ].map(([title, body]) => h("article", { class: "method__item" }, [h("h3", null, title), h("p", null, body)])));
  const apiSources = new Map(rawApi.map((quote) => [quote.id, quote.sourceUrl]));
  const reference = pk
    ? "PKR estimates from published USD prices. Check regional availability and billing at the provider."
    : "Published USD reference prices. Check the provider for current availability and billing.";
  app.append(renderHeader(), h("main", null, [
    hero,
    section("plans", "Subscription catalog", reference, renderPlans(view.plans, rawPlans, referenceMoney)),
    section("api", "API rates", `${reference} Rates are per million tokens.`, renderApi(view.api, rawApi, referenceMoney)),
    section("estimate", "Monthly API cost estimator", "Enter your expected usage to compare monthly costs across model quotes.",
      renderEstimator(view.api.map((quote) => ({ ...quote, sourceUrl: apiSources.get(quote.id) })), referenceMoney)),
    section("value", "Model performance vs. cost", "Agentic Index and USD task costs from public benchmarks.", renderScatter(view.models)),
    section("platforms", "Providers", "Browse model providers, cloud platforms and coding tools.", renderPlatforms(platforms, view.plans, view.api)),
    section("method", "How prices are compared", "Source links and verification dates are shown with each quote.", method),
  ]), h("footer", { class: "site-footer" }, [h("div", { class: "shell site-footer__grid" }, [
    h("a", { href: "https://github.com/supercli-site/awesome-coding-plan" }, "Adapted from SuperCLI’s Awesome Coding Plan"),
    h("a", { href: markets.fx.sourceUrl }, `Reference rate: 1 USD = ${markets.fx.rates.PKR} PKR (${markets.fx.date})`),
  ])]));
}

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing application root");
mount(app).catch((error: unknown) => {
  const retry = h("button", { type: "button" }, "Reload");
  retry.addEventListener("click", () => location.reload());
  app.append(h("div", { class: "error shell", role: "alert" }, [
    h("h1", null, "Could not load pricing data"),
    h("p", null, error instanceof Error ? error.message : String(error)),
    retry,
  ]));
});
