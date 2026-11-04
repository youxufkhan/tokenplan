/** Plan catalog, API table, platform list and the cost/benchmark scatter. Routing: single-page anchors. Data: static data/*.json. */
import { h, clear } from "./dom";
import { modelBadge, vendorBadge } from "./model-icons";
import { CONFIDENCE, KIND, STATUS, money, moneyCompact } from "./format";
import type { UsdApi, UsdModel, UsdPlan, PlatformsFile, RawApi, RawPlan } from "../types";

const link = (text: string, url?: string | null) => url && /^https:\/\//.test(url)
  ? h("a", { href: url, target: "_blank", rel: "noopener noreferrer" }, text)
  : h("span", null, text);
const label = (text: string) => h("span", { class: "chip" }, text);
const confidence = (value: string) => h("span", { class: `conf conf--${value}` }, CONFIDENCE[value] ?? "Unverified");
const field = (name: string, options: [string, string][]) => h("label", { class: "field" }, [name,
  h("select", { "aria-label": name }, options.map(([value, text]) => h("option", { value }, text))),
]);

/** Filterable plan cards; raw details and derived USD data are joined by id. */
export function renderPlans(plans: UsdPlan[], raw: RawPlan[], format = money): HTMLElement {
  const details = new Map(raw.map((p) => [p.id, p]));
  const status = field("Status", [["all", "All"], ["active", "Available"], ["sold-out-daily", "Limited daily"], ["other", "Other"]]);
  const kind = field("Type", [["all", "All"], ["coding-plan", "Coding Plan"], ["token-plan", "Token Plan"], ["ide", "IDE"], ["free", "Free"]]);
  const search = h("input", { type: "search", placeholder: "Search providers or plans", "aria-label": "Search subscriptions" });
  const count = h("span", { class: "toolbar__count", role: "status" });
  const grid = h("div", { class: "plan-grid" });
  const toolbar = h("div", { class: "toolbar" }, [status, kind, h("label", { class: "field" }, ["Search", search]), count]);
  function update() {
    const matches = plans.filter((p) => {
      const text = `${p.vendor} ${p.name} ${details.get(p.id)?.models?.join(" ") ?? ""}`.toLocaleLowerCase();
      return (kind.querySelector("select")!.value === "all" || p.kind === kind.querySelector("select")!.value)
        && (status.querySelector("select")!.value === "all" || (status.querySelector("select")!.value === "other"
          ? !["active", "sold-out-daily"].includes(p.status) : p.status === status.querySelector("select")!.value))
        && text.includes(search.value.trim().toLocaleLowerCase());
    });
    clear(grid);
    count.textContent = `Showing ${matches.length} / ${plans.length} plans`;
    if (!matches.length) grid.append(h("div", { class: "empty" }, "No plans match these filters."));
    for (const p of matches) {
      const detail = details.get(p.id);
      const price = p.monthlyUsd != null ? format(p.monthlyUsd)
        : p.status === "no-plan" ? "Pay as you go"
        : p.status === "discontinued" ? "Discontinued"
        : p.status === "coming-soon" ? "Coming soon" : "Price unverified";
      grid.append(h("article", { class: "plan" }, [
        h("div", { class: "plan__top" }, [vendorBadge(p.platformId, p.vendor),
          h("div", { class: "plan__head" }, [h("h3", { class: "plan__name" }, p.name), h("p", { class: "plan__vendorline" }, p.vendor)])]),
        h("div", { class: "plan__price" }, [h("strong", { class: "plan__amount" }, price),
          h("span", { class: "plan__period" }, p.monthlyUsd == null ? "" : "/mo equivalent")]),
        p.firstPeriodUsd != null ? h("p", { class: "plan__credithint" }, `First period: ${format(p.firstPeriodUsd)}`) : null,
        h("p", { class: "plan__quota" }, detail?.quota ?? "See provider for limits"),
        h("div", { class: "plan__models" }, (detail?.models ?? []).slice(0, 3).map(label)),
        h("div", { class: "plan__meta" }, [label(KIND[p.kind] ?? p.kind),
          label(STATUS[p.status] ?? p.status), confidence(p.confidence),
          h("div", { class: "plan__links" }, [link(p.status === "active" || p.status === "sold-out-daily" ? "Buy" : "Provider", detail?.buyUrl ?? p.platformUrl), link("Source", detail?.sourceUrl)])]),
        h("small", { class: "detail-note" }, `Checked ${detail?.verifiedAt ?? "Date unknown"}${detail?.price?.note ? ` · Billing: ${detail.price.note}` : ""}${detail?.includedCredit?.text ? ` · Included credit: ${detail.includedCredit.text}` : ""}${detail?.notes ? ` · Terms: ${detail.notes}` : ""}`),
      ]));
    }
  }
  toolbar.addEventListener("input", update);
  toolbar.addEventListener("change", update);
  update();
  return h("div", null, [toolbar, grid]);
}

/** API rate table: input, output and 3:1 blended price per million tokens. */
export function renderApi(prices: UsdApi[], raw: RawApi[], format = money): HTMLElement {
  const details = new Map(raw.map((p) => [p.id, p]));
  const search = h("input", { type: "search", placeholder: "Search models or providers", "aria-label": "Search API models" });
  const count = h("span", { class: "toolbar__count", role: "status" });
  const body = h("tbody");
  const table = h("table", { class: "data" }, [
    h("thead", null, h("tr", null, ["Model / Provider", "Uncached input", "Output", "Cache hit", "3:1 blended", "Verification / Source"].map((x) => h("th", { scope: "col" }, x)))), body,
  ]);
  function update() {
    const found = prices.filter((p) => `${p.model} ${p.vendor}`.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase()));
    count.textContent = `Showing ${found.length} / ${prices.length} prices`;
    clear(body);
    for (const p of found) {
      const detail = details.get(p.id);
      const source = detail?.sourceUrl ?? p.sourceUrl;
      body.append(h("tr", null, [
        h("td", null, h("div", { class: "model-cell" }, [modelBadge(p.model), h("div", null, [h("strong", { class: "cell-model" }, p.model), h("span", { class: "cell-vendor block" }, `${p.vendor} · ${p.offeringLabel ?? "Unknown seller"}`)])])),
        h("td", { class: "num" }, format(p.inputUsd)), h("td", { class: "num" }, format(p.outputUsd)),
        h("td", { class: "num" }, format(p.cacheHitUsd)), h("td", { class: "num" }, format(p.blendedUsd)),
        h("td", null, [confidence(p.confidence), h("span", { class: "block detail-note" }, detail?.verifiedAt ?? p.verifiedAt ?? "Date unknown"),
          link("Official source", source), detail?.tiering ? h("span", { class: "block detail-note" }, `Billing: ${detail.tiering}`) : null,
          detail?.notes ? h("span", { class: "block detail-note" }, `Notes: ${detail.notes}`) : null]),
      ]));
    }
  }
  const toolbar = h("div", { class: "toolbar" }, [h("label", { class: "field" }, ["Search", search]), count]);
  toolbar.addEventListener("input", update);
  toolbar.addEventListener("change", update);
  update();
  return h("div", null, [toolbar, h("div", { class: "table-wrap" }, table)]);
}

/** Plot every observation; records missing Agentic Index or cost per task are skipped. */
export function renderScatter(models: UsdModel[]): HTMLElement {
  const valid = models.filter((m) => m.agenticIndex != null && Number.isFinite(m.agenticIndex)
    && m.costPerTaskUsd != null && Number.isFinite(m.costPerTaskUsd) && m.costPerTaskUsd > 0);
  if (!valid.length) return h("div", { class: "empty" }, "Model cost and benchmark data are unavailable.");
  const width = 760, height = 390, left = 58, right = 22, top = 20, bottom = 55;
  const maxX = Math.max(...valid.map((m) => m.costPerTaskUsd!));
  const minY = Math.min(...valid.map((m) => m.agenticIndex!));
  const maxY = Math.max(...valid.map((m) => m.agenticIndex!));
  const x = (n: number) => left + (n / maxX) * (width - left - right);
  const y = (n: number) => top + (1 - (n - minY) / (maxY - minY || 1)) * (height - top - bottom);
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${valid.length} models plotted by cost and Agentic Index`);
  const add = (tag: string, attrs: Record<string, string>, text?: string) => {
    const el = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (text) el.textContent = text;
    svg.append(el);
    return el;
  };
  for (let i = 0; i <= 4; i++) {
    const vx = maxX * i / 4, vy = minY + (maxY - minY) * i / 4;
    add("line", { x1: String(x(vx)), x2: String(x(vx)), y1: String(top), y2: String(height - bottom), stroke: "var(--line)" });
    add("line", { x1: String(left), x2: String(width - right), y1: String(y(vy)), y2: String(y(vy)), stroke: "var(--line)" });
    add("text", { x: String(x(vx)), y: String(height - 28), "text-anchor": "middle", fill: "var(--muted)", "font-size": "11" }, vx.toFixed(0));
    add("text", { x: String(left - 9), y: String(y(vy) + 4), "text-anchor": "end", fill: "var(--muted)", "font-size": "11" }, vy.toFixed(0));
  }
  add("text", { x: String(width / 2), y: String(height - 5), "text-anchor": "middle", fill: "var(--ink)", "font-size": "12" }, "Cost per task (USD)");
  add("text", { x: "14", y: "17", fill: "var(--ink)", "font-size": "12" }, "Agentic Index");
  for (const m of valid) {
    const dot = add("circle", { cx: String(x(m.costPerTaskUsd!)), cy: String(y(m.agenticIndex!)), r: "4.5",
      fill: m.openWeights ? "var(--warn)" : "var(--accent)", opacity: ".82", tabindex: "0" });
    dot.append(Object.assign(document.createElementNS(ns, "title"), { textContent: `${m.model} · ${money(m.costPerTaskUsd)} · Agentic Index ${m.agenticIndex}` }));
  }
  return h("figure", { class: "scatter__card" }, [svg, h("figcaption", { class: "detail-note" }, `${valid.length} models. Purple indicates closed weights and gold indicates open weights. Focus or hover over a point for details.`) ]);
}

/** Platform registry: sellers and tool bundling come from platforms.json. */
export function renderPlatforms(file: PlatformsFile, plans: UsdPlan[], api: UsdApi[]): HTMLElement {
  return h("div", { class: "platform-grid" }, file.platforms.map((p) => h("article", { class: "platform" }, [
    h("div", { class: "platform__top" }, [vendorBadge(p.id, p.name), h("h3", { class: "platform__name" }, p.name),
      h("span", { class: `chip chip--${p.offering}` }, file.offeringDefs[p.offering]?.label ?? p.offering)]),
    h("p", { class: "platform__note" }, p.note),
    h("div", { class: "platform__foot" }, [label(file.bundleDefs[p.bundle]?.label ?? p.bundle), link("Platform", p.url),
      h("span", { class: "platform__count" }, `${plans.filter((x) => x.platformId === p.id).length} subscriptions / ${api.filter((x) => x.platformId === p.id).length} API`)]),
  ])));
}
