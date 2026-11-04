/** Plan comparison list: filter, sort, expand a row for terms, pick plans for side-by-side comparison. */
import { h, clear } from "./dom";
import type { Ctx } from "./ctx";
import { selection, MAX_COMPARE } from "./store";
import { vendorBadge } from "./model-icons";
import { CONFIDENCE, KIND, STATUS, shortDate } from "./format";
import type { UsdPlan } from "../types";

type Sort = "price-asc" | "price-desc" | "credit" | "vendor" | "checked";
const SORTS: [Sort, string][] = [["price-asc", "Price, low to high"], ["price-desc", "Price, high to low"], ["credit", "Most included credit per $"], ["vendor", "Provider A to Z"], ["checked", "Recently checked"]];
const KINDS: [string, string][] = [["all", "All"], ["paid", "Paid"], ["free", "Free"], ["coding-plan", "Coding plans"], ["ide", "IDE tools"], ["token-plan", "Token plans"]];

const link = (text: string, url?: string | null, cls = "") => url && /^https:\/\//.test(url)
  ? h("a", { href: url, target: "_blank", rel: "noopener noreferrer", class: cls }, text) : null;

export function renderPlans(ctx: Ctx): HTMLElement {
  const params = new URLSearchParams(location.search);
  const state = {
    sort: (SORTS.some(([k]) => k === params.get("sort")) ? params.get("sort") : "price-asc") as Sort,
    kind: params.get("kind") ?? "all",
    vendor: params.get("vendor") ?? "all",
    q: params.get("q") ?? "",
    max: Number(params.get("max")) || 0,
    unavailable: params.get("all") === "1",
  };
  const maxPrice = Math.ceil(Math.max(...ctx.plans.map((p) => p.monthlyUsd ?? 0)));
  if (!state.max || state.max > maxPrice) state.max = maxPrice;

  const list = h("div", { class: "plist", role: "list" });
  const count = h("p", { class: "toolbar__count", role: "status" });
  const sortSel = h("select", { "aria-label": "Sort plans" }, SORTS.map(([v, t]) => h("option", { value: v, selected: v === state.sort }, t)));
  const vendors = [...new Set(ctx.plans.map((p) => p.vendor))].sort();
  const vendorSel = h("select", { "aria-label": "Provider" }, [h("option", { value: "all" }, "All providers"), ...vendors.map((v) => h("option", { value: v, selected: v === state.vendor }, v))]);
  const search = h("input", { type: "search", placeholder: "Search plan, provider or model", "aria-label": "Search plans", value: state.q });
  const maxOut = h("output", null, "");
  const range = h("input", { type: "range", min: "0", max: String(maxPrice), step: "1", value: String(state.max), "aria-label": "Maximum monthly price" });
  const showAll = h("input", { type: "checkbox", checked: state.unavailable });
  const chips = h("div", { class: "chips", role: "group", "aria-label": "Plan type" });

  const paintChips = () => {
    clear(chips);
    for (const [value, label] of KINDS) {
      const b = h("button", { type: "button", class: "chip-btn", "aria-pressed": String(state.kind === value) }, label);
      b.addEventListener("click", () => { state.kind = value; update(); });
      chips.append(b);
    }
  };

  const credit = (p: UsdPlan) => p.creditRatio != null ? h("span", { class: `credit${p.creditRatio >= 1 ? " credit--good" : ""}`, title: p.creditText ?? "" }, `${ctx.fmt(p.includedCreditUsd)} credit · ${p.creditRatio.toFixed(1)}×`) : null;

  function row(p: UsdPlan, maxMonthly: number): HTMLElement {
    const quote = ctx.quotes.get(p.id);
    const bar = p.monthlyUsd != null ? Math.max(p.monthlyUsd > 0 ? 2 : 0, (p.monthlyUsd / maxMonthly) * 100) : 0;
    const price = p.monthlyUsd != null ? (p.monthlyUsd === 0 ? "Free" : ctx.fmt(p.monthlyUsd))
      : p.status === "no-plan" ? "Pay as you go" : p.status === "discontinued" ? "Discontinued" : p.status === "coming-soon" ? "Coming soon" : "Price unverified";
    const pick = h("input", { type: "checkbox", class: "pick-box", "aria-label": `Compare ${p.name}`, checked: selection.has(p.id), "data-plan": p.id });
    pick.addEventListener("change", () => {
      if (!selection.toggle(p.id)) { pick.checked = false; alert_full(); }
    });
    const more = h("div", { class: "row__more" }, [
      p.notes ? h("p", null, [h("b", null, "Terms. "), p.notes]) : null,
      p.priceNote ? h("p", null, [h("b", null, "Billing. "), p.priceNote]) : null,
      p.creditText ? h("p", null, [h("b", null, "Included credit. "), p.creditText]) : null,
      h("p", null, [h("b", null, "Seller. "), `${p.offeringLabel ?? "Unlabeled"}${p.bundleLabel ? ` · ${p.bundleLabel}` : ""}`]),
    ]);
    const toggle = h("button", { type: "button", class: "row__toggle", "aria-expanded": "false" }, "Details");
    toggle.addEventListener("click", () => {
      const open = more.parentElement!.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Hide" : "Details";
    });
    const el = h("article", { class: `row${selection.has(p.id) ? " is-picked" : ""}`, role: "listitem", "data-plan": p.id }, [
      h("div", { class: "row__pick" }, pick),
      h("div", { class: "row__plan" }, [vendorBadge(p.platformId, p.vendor), h("div", null, [h("h3", null, p.name), h("p", null, `${p.vendor} · ${KIND[p.kind] ?? p.kind}`)])]),
      h("div", { class: "row__price" }, [
        h("strong", null, price),
        p.monthlyUsd ? h("span", { class: "row__per" }, "per month") : null,
        p.monthlyUsd != null ? h("span", { class: "bar" }, h("i", { style: `width:${bar}%` })) : null,
        p.firstPeriodUsd != null ? h("span", { class: "row__first" }, `First period ${ctx.fmt(p.firstPeriodUsd)}`) : null,
        credit(p),
      ]),
      h("div", { class: "row__quota" }, [
        h("p", null, p.quota ?? "See provider for limits"),
        h("div", { class: "models" }, (p.models ?? []).slice(0, 4).map((m) => h("span", { class: "tag" }, m))),
      ]),
      h("div", { class: "row__local" }, quote
        ? [h("strong", null, quote.currency === "PKR" ? `PKR ${quote.amount.toLocaleString("en-US")}` : `$${quote.amount}`), link(quote.channel, quote.sourceUrl) ?? quote.channel]
        : [h("span", { class: "muted" }, "Not recorded")]),
      h("div", { class: "row__trust" }, [
        h("span", { class: `conf conf--${p.confidence}` }, CONFIDENCE[p.confidence] ?? "Unverified"),
        h("span", { class: "muted" }, `Checked ${shortDate(p.verifiedAt)}`),
        h("div", { class: "row__links" }, [link(p.status === "active" || p.status === "sold-out-daily" ? "Buy" : "Provider", p.buyUrl ?? p.platformUrl, "btn"), link("Source", p.sourceUrl), toggle]),
      ]),
      more,
    ]);
    return el;
  }

  const alert_full = () => { count.textContent = `You can compare up to ${MAX_COMPARE} plans. Remove one first.`; };

  function update() {
    paintChips();
    maxOut.textContent = state.max >= maxPrice ? "any price" : `up to ${ctx.fmt(state.max)}/mo`;
    const q = state.q.trim().toLocaleLowerCase();
    const found = ctx.plans.filter((p) => {
      const live = p.status === "active" || p.status === "sold-out-daily";
      if (!live && !state.unavailable) return false;
      if (state.kind === "paid" && !((p.monthlyUsd ?? 0) > 0)) return false;
      if (state.kind === "free" && p.monthlyUsd !== 0) return false;
      if (!["all", "paid", "free"].includes(state.kind) && p.kind !== state.kind) return false;
      if (state.vendor !== "all" && p.vendor !== state.vendor) return false;
      if (p.monthlyUsd != null && p.monthlyUsd > state.max) return false;
      return !q || `${p.vendor} ${p.name} ${(p.models ?? []).join(" ")} ${p.quota ?? ""}`.toLocaleLowerCase().includes(q);
    });
    const price = (p: UsdPlan, missing: number) => p.monthlyUsd ?? missing;
    found.sort({
      "price-asc": (a: UsdPlan, b: UsdPlan) => price(a, 1e9) - price(b, 1e9) || a.name.localeCompare(b.name),
      "price-desc": (a: UsdPlan, b: UsdPlan) => price(b, -1) - price(a, -1) || a.name.localeCompare(b.name),
      credit: (a: UsdPlan, b: UsdPlan) => (b.creditRatio ?? -1) - (a.creditRatio ?? -1),
      vendor: (a: UsdPlan, b: UsdPlan) => a.vendor.localeCompare(b.vendor) || price(a, 1e9) - price(b, 1e9),
      checked: (a: UsdPlan, b: UsdPlan) => (b.verifiedAt ?? "").localeCompare(a.verifiedAt ?? ""),
    }[state.sort]);
    count.textContent = `${found.length} of ${ctx.plans.length} plans`;
    clear(list);
    const maxMonthly = Math.max(...found.map((p) => p.monthlyUsd ?? 0), 1);
    if (!found.length) list.append(h("div", { class: "empty" }, [h("p", null, "No plans match these filters."), reset]));
    for (const p of found) list.append(row(p, maxMonthly));

    const next = new URLSearchParams(location.search);
    const set = (k: string, v: string, def: string) => (v === def ? next.delete(k) : next.set(k, v));
    set("sort", state.sort, "price-asc"); set("kind", state.kind, "all"); set("vendor", state.vendor, "all");
    set("q", state.q, ""); set("max", String(state.max), String(maxPrice)); set("all", state.unavailable ? "1" : "0", "0");
    history.replaceState(null, "", `${location.pathname}${next.size ? `?${next}` : ""}${location.hash}`);
  }

  const reset = h("button", { type: "button", class: "btn btn--ghost" }, "Clear filters");
  reset.addEventListener("click", () => { Object.assign(state, { sort: "price-asc", kind: "all", vendor: "all", q: "", max: maxPrice, unavailable: false }); sortSel.value = "price-asc"; vendorSel.value = "all"; search.value = ""; range.value = String(maxPrice); showAll.checked = false; update(); });

  sortSel.addEventListener("change", () => { state.sort = sortSel.value as Sort; update(); });
  vendorSel.addEventListener("change", () => { state.vendor = vendorSel.value; update(); });
  search.addEventListener("input", () => { state.q = search.value; update(); });
  range.addEventListener("input", () => { state.max = Number(range.value); update(); });
  showAll.addEventListener("change", () => { state.unavailable = showAll.checked; update(); });
  window.addEventListener("tp:filter", (e) => {
    const d = (e as CustomEvent<{ sort?: Sort; kind?: string }>).detail;
    if (d.sort) { state.sort = d.sort; sortSel.value = d.sort; }
    if (d.kind) state.kind = d.kind;
    update();
  });
  selection.subscribe(() => list.querySelectorAll<HTMLElement>(".row").forEach((r) => {
    const on = selection.has(r.dataset.plan ?? "");
    r.classList.toggle("is-picked", on);
    const box = r.querySelector<HTMLInputElement>(".pick-box");
    if (box) box.checked = on;
  }));

  const toolbar = h("div", { class: "toolbar" }, [
    chips,
    h("div", { class: "toolbar__fields" }, [
      h("label", { class: "field" }, [h("span", null, "Sort"), sortSel]),
      h("label", { class: "field" }, [h("span", null, "Provider"), vendorSel]),
      h("label", { class: "field field--grow" }, [h("span", null, "Search"), search]),
      h("label", { class: "field" }, [h("span", null, ["Budget ", maxOut]), range]),
      h("label", { class: "check" }, [showAll, "Include discontinued and unpriced"]),
    ]),
    count,
  ]);
  const head = h("div", { class: "plist__head", "aria-hidden": "true" }, ["", "Plan", "Monthly price", "What you get", ctx.market === "PK" ? "Pakistan App Store" : "US App Store", "Verification"].map((t) => h("span", null, t)));
  update();
  return h("div", null, [toolbar, head, list]);
}
