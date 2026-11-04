/** API rates ranked by what your monthly usage would cost. */
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
    return { total: estimateApiCost(a, Number(input.value), Number(output.value), withCache ? Number(cache.value) : 0), noCache: !withCache && Number(cache.value) > 0 };
  };

  function update() {
    paintPresets();
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
    const width = (v: number) => Math.max(1.5, (Math.log10(1 + v) / Math.log10(1 + max)) * 100);
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
          h("span", { class: "muted" }, `Checked ${shortDate(d?.verifiedAt ?? a.verifiedAt)}`),
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
  update();
  return h("div", null, [panel, toolbar, list]);
}
