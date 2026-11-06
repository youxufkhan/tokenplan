import { reviewText } from "./trust";
/** API rates ranked by what your monthly usage would cost. */
import { savedPanel } from "./saved";
import { h, clear } from "./dom";
import type { Ctx } from "./ctx";
import { estimateApiCost } from "../estimate";
import { modelBadge } from "./model-icons";
import { CONFIDENCE, shortDate } from "./format";
import type { RawApi, UsdApi } from "../types";

const PRESETS: { label: string; hint: string; input: number; output: number; cache: number }[] = [
  { label: "Light use", hint: "A few chats a day", input: 2, output: 0.5, cache: 0 },
  { label: "Daily coding agent", hint: "One developer, agent all day", input: 60, output: 6, cache: 60 },
  { label: "Heavy automation", hint: "Several agents in parallel", input: 400, output: 40, cache: 70 },
];

export function renderApi(ctx: Ctx, raw: RawApi[]): HTMLElement {
  const detail = new Map(raw.map((r) => [r.id, r]));
  const num = (value: number, label: string, max?: number) => h("input", { type: "number", min: "0", max: max != null ? String(max) : null, step: "any", value: String(value), "aria-label": label });
  const input = num(PRESETS[1].input, "Input millions of tokens per month");
  const output = num(PRESETS[1].output, "Output millions of tokens per month");
  const cache = num(PRESETS[1].cache, "Cached share of input in percent", 100);
  const search = h("input", { type: "search", placeholder: "Search model or provider", "aria-label": "Search API models" });
  const sellers = h("select", { "aria-label": "Seller type" }, [["all", "All sellers"], ["first-party", "Model providers"], ["cloud-platform", "Cloud platforms"], ["reseller", "Resellers"]].map(([v, t]) => h("option", { value: v }, t)));
  const restoreStatus = h("span", { role: "status" });
  try {
    const last = JSON.parse(localStorage.getItem("tokenplan:workload:last:v1") ?? "null");
    if (last && typeof last === "object") {
      if ([last.input, last.output, last.cache].every((value) => typeof value === "number" && Number.isFinite(value) && value >= 0) && last.cache <= 100) {
        input.value = String(last.input); output.value = String(last.output); cache.value = String(last.cache);
        search.value = typeof last.search === "string" ? last.search : "";
        if (["all", "first-party", "cloud-platform", "reseller"].includes(last.seller)) sellers.value = last.seller;
      }
    }
  } catch { restoreStatus.textContent = "Previous workload could not be restored from this browser."; }
  const params = new URLSearchParams(location.search);
  if (params.has("apiIn")) input.value = params.get("apiIn")!;
  if (params.has("apiOut")) output.value = params.get("apiOut")!;
  if (params.has("apiCache")) cache.value = params.get("apiCache")!;
  if (params.has("apiQ")) search.value = params.get("apiQ")!;
  if (["all", "first-party", "cloud-platform", "reseller"].includes(params.get("apiSeller") ?? "")) sellers.value = params.get("apiSeller")!;
  const list = h("div", { class: "alist", role: "list" });
  const count = h("p", { class: "toolbar__count", role: "status" });
  const presetBar = h("div", { class: "chips", role: "group", "aria-label": "Usage presets" });

  const paintPresets = () => {
    clear(presetBar);
    for (const p of PRESETS) {
      const active = Number(input.value) === p.input && Number(output.value) === p.output && Number(cache.value) === p.cache;
      const b = h("button", { type: "button", class: "chip-btn", "aria-pressed": String(active), title: p.hint }, [p.label, h("small", null, `${p.input}M in · ${p.output}M out`)]);
      b.addEventListener("click", () => { input.value = String(p.input); output.value = String(p.output); cache.value = String(p.cache); update(); });
      presetBar.append(b);
    }
  };

  const cost = (a: UsdApi) => {
    const withCache = a.cacheHitUsd != null;
    return { total: estimateApiCost(a, input.valueAsNumber, output.valueAsNumber, withCache ? cache.valueAsNumber : 0), noCache: !withCache && Number(cache.value) > 0 };
  };

  function update() {
    paintPresets();
    const next = new URLSearchParams(location.search);
    // Only non-default inputs go in the URL, so the plain page keeps one clean address.
    const defaults = { apiIn: String(PRESETS[1].input), apiOut: String(PRESETS[1].output), apiCache: String(PRESETS[1].cache), apiQ: "", apiSeller: "all" };
    for (const [key, value] of [["apiIn", input.value], ["apiOut", output.value], ["apiCache", cache.value], ["apiQ", search.value], ["apiSeller", sellers.value]] as const) {
      if (value === defaults[key]) next.delete(key); else next.set(key, value);
    }
    history.replaceState(null, "", `${location.pathname}${next.size ? `?${next}` : ""}${location.hash}`);
    const valid = [input.valueAsNumber, output.valueAsNumber, cache.valueAsNumber].every((value) => Number.isFinite(value) && value >= 0) && cache.valueAsNumber <= 100;
    if (!valid) { clear(list); count.textContent = "Enter valid usage amounts, with cached input between 0 and 100%."; return; }
    try { localStorage.setItem("tokenplan:workload:last:v1", JSON.stringify({ input: input.valueAsNumber, output: output.valueAsNumber, cache: cache.valueAsNumber, search: search.value, seller: sellers.value })); }
    catch { restoreStatus.textContent = "This browser cannot retain the workload. Your current inputs still work."; }
    const q = search.value.trim().toLocaleLowerCase();
    const rows = ctx.api
      .filter((a) => (sellers.value === "all" || a.offering === sellers.value) && (!q || `${a.model} ${a.vendor}`.toLocaleLowerCase().includes(q)))
      .map((a) => ({ a, ...cost(a) }))
      .filter((r): r is { a: UsdApi; total: number; noCache: boolean } => r.total != null)
      .sort((x, y) => x.total - y.total);
    clear(list);
    count.textContent = `${rows.length} of ${ctx.api.length} models, cheapest first`;
    if (!rows.length) { list.append(h("div", { class: "empty" }, "Enter valid usage amounts, or loosen the search.")); return; }
    const max = rows[rows.length - 1].total;
    // Log scale: a 100x spread would otherwise flatten every cheap model to a sliver.
    const width = (v: number) => max === 0 ? 0 : Math.max(1.5, (Math.log10(1 + v) / Math.log10(1 + max)) * 100);
    const cheapest = rows[0].total;
    rows.forEach(({ a, total, noCache }, i) => {
      const d = detail.get(a.id);
      list.append(h("article", { class: `arow${i === 0 ? " is-best" : ""}`, role: "listitem" }, [
        h("div", { class: "arow__model" }, [modelBadge(a.model), h("div", null, [h("h3", null, a.model), h("p", null, `${a.vendor} · ${a.offeringLabel ?? "Seller not labeled"}`)])]),
        h("div", { class: "arow__cost" }, [
          h("strong", null, `${ctx.fmt(total)}`),
          h("span", { class: "muted" }, "per month"),
          h("span", { class: "bar" }, h("i", { style: `width:${width(total)}%` })),
          i > 0 && cheapest > 0 ? h("span", { class: "arow__x" }, `${(total / cheapest).toFixed(total / cheapest < 10 ? 1 : 0)}× the cheapest`) : h("span", { class: "arow__x arow__x--best" }, "Cheapest for this usage"),
        ]),
        h("dl", { class: "arow__rates" }, [
          h("div", null, [h("dt", null, "Input"), h("dd", null, ctx.fmt(a.inputUsd))]),
          h("div", null, [h("dt", null, "Output"), h("dd", null, ctx.fmt(a.outputUsd))]),
          h("div", null, [h("dt", null, "Cached input"), h("dd", null, a.cacheHitUsd != null ? ctx.fmt(a.cacheHitUsd) : "None")]),
        ]),
        h("div", { class: "arow__trust" }, [
          h("span", { class: `conf conf--${a.confidence}` }, CONFIDENCE[a.confidence] ?? "Unverified"),
          h("span", { class: "muted" }, reviewText({ ...a, ...d })),
          noCache ? h("span", { class: "muted" }, "No cache discount published") : null,
          d?.sourceUrl ? h("a", { href: d.sourceUrl, target: "_blank", rel: "noopener noreferrer" }, "Source") : null,
          d?.tiering ? h("span", { class: "muted arow__note" }, d.tiering) : null,
        ]),
      ]));
    });
  }

  for (const el of [input, output, cache, search]) el.addEventListener("input", update);
  sellers.addEventListener("change", update);
  const panel = h("div", { class: "usage" }, [
    h("div", null, [h("p", { class: "usage__lead" }, "Describe a month of use. Every model is priced for it below, cheapest first."), presetBar]),
    h("div", { class: "usage__fields" }, [
      h("label", { class: "field" }, [h("span", null, "Input, million tokens"), input]),
      h("label", { class: "field" }, [h("span", null, "Output, million tokens"), output]),
      h("label", { class: "field" }, [h("span", null, "Cached input, %"), cache]),
    ]),
  ]);
  const toolbar = h("div", { class: "toolbar toolbar--tight" }, [h("label", { class: "field field--grow" }, [h("span", null, "Search"), search]), h("label", { class: "field" }, [h("span", null, "Seller"), sellers]), count]);
  type Workload = { input: number; output: number; cache: number; search: string; seller: string };
  const saves = savedPanel<Workload>("workloads", () => ({ input: input.valueAsNumber, output: output.valueAsNumber, cache: cache.valueAsNumber, search: search.value, seller: sellers.value }), (value) => {
    input.value = String(value.input); output.value = String(value.output); cache.value = String(value.cache); search.value = value.search; sellers.value = value.seller; update();
  }, (value): value is Workload => {
    if (!value || typeof value !== "object") return false;
    const item = value as Workload;
    return [item.input, item.output, item.cache].every((number) => Number.isFinite(number) && number >= 0) && item.cache <= 100 && typeof item.search === "string" && ["all", "first-party", "cloud-platform", "reseller"].includes(item.seller);
  });
  const share = h("button", { type: "button", class: "btn btn--ghost" }, "Copy workload link");
  const shareStatus = h("span", { role: "status" });
  share.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(location.href); shareStatus.textContent = "Link copied."; }
    catch { shareStatus.textContent = "Copy the address from your browser to share this workload."; }
  });
  update();
  return h("div", null, [panel, restoreStatus, saves, share, shareStatus, toolbar, list]);
}
