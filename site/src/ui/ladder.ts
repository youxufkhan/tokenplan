/** The price ladder: every available plan as a dot on one shared monthly-price line, one lane per provider. */
import { h } from "./dom";
import type { Ctx } from "./ctx";
import { selection } from "./store";
import { vendorBadge } from "./model-icons";
import type { UsdPlan } from "../types";

const TICKS = [0, 10, 20, 50, 100, 200, 400];

export function renderLadder(ctx: Ctx): HTMLElement {
  const plans = ctx.plans.filter((p) => p.monthlyUsd != null && (p.status === "active" || p.status === "sold-out-daily"));
  const max = Math.max(...plans.map((p) => p.monthlyUsd!));
  // Log-ish axis: $0 sits at the left edge and the $8-$20 cluster stays readable.
  const at = (usd: number) => (Math.log10(1 + usd) / Math.log10(1 + max)) * 100;

  const lanes = new Map<string, UsdPlan[]>();
  for (const p of plans) lanes.set(p.vendor, [...(lanes.get(p.vendor) ?? []), p]);
  const ordered = [...lanes.entries()].sort((a, b) =>
    Math.min(...a[1].map((p) => p.monthlyUsd!)) - Math.min(...b[1].map((p) => p.monthlyUsd!)) || a[0].localeCompare(b[0]));

  const readout = h("div", { class: "ladder__readout", "aria-live": "polite" });
  const showDefault = () => {
    readout.replaceChildren(h("span", { class: "ladder__hint" }, "Hover or focus a dot to see the plan. Click it to add it to the comparison."));
  };
  const show = (p: UsdPlan) => {
    const quote = ctx.quotes.get(p.id);
    readout.replaceChildren(...[
      h("strong", null, `${p.name}`),
      h("span", { class: "ladder__price" }, p.monthlyUsd === 0 ? "Free" : `${ctx.fmt(p.monthlyUsd)}/mo`),
      quote ? h("span", null, `${quote.channel}: ${quote.currency === "PKR" ? "PKR " + quote.amount.toLocaleString("en-US") : "$" + quote.amount}`) : null,
      h("span", { class: "ladder__quota" }, p.quota ?? ""),
    ].filter((n): n is HTMLElement => n != null));
  };
  showDefault();

  const axis = h("div", { class: "ladder__axis", "aria-hidden": "true" },
    TICKS.filter((t) => t <= max * 1.02).map((t) =>
      h("span", { style: `left:${at(t)}%` }, t === 0 ? "Free" : ctx.fmtCompact(t))));

  const grid = h("div", { class: "ladder__grid", "aria-hidden": "true" },
    TICKS.filter((t) => t <= max * 1.02).map((t) => h("i", { style: `left:${at(t)}%` })));

  const rows = ordered.map(([vendor, list]) => {
    const sorted = [...list].sort((a, b) => a.monthlyUsd! - b.monthlyUsd!);
    let lastX = -99;
    let flip = 0;
    const dots = sorted.map((p, i) => {
      const x = at(p.monthlyUsd!);
      const crowded = x - lastX < 2.4;
      const nextX = i + 1 < sorted.length ? at(sorted[i + 1].monthlyUsd!) : 999;
      const labeled = p.monthlyUsd! > 0 && !crowded && nextX - x >= 7;
      flip = crowded ? flip + 1 : 0;
      lastX = x;
      const dot = h("button", {
        type: "button",
        class: `dot${p.monthlyUsd === 0 ? " dot--free" : ""}${selection.has(p.id) ? " is-picked" : ""}${crowded ? ` dot--shift${flip % 2 ? "a" : "b"}` : ""}`,
        style: `left:${x}%`,
        "data-plan": p.id,
        "aria-label": `${p.name}, ${p.monthlyUsd === 0 ? "free" : ctx.fmt(p.monthlyUsd) + " per month"}. Toggle comparison.`,
        "aria-pressed": String(selection.has(p.id)),
      }, labeled ? h("span", { class: "dot__label" }, ctx.fmtCompact(p.monthlyUsd)) : null);
      dot.addEventListener("mouseenter", () => show(p));
      dot.addEventListener("focus", () => show(p));
      dot.addEventListener("mouseleave", showDefault);
      dot.addEventListener("click", () => {
        if (!selection.toggle(p.id)) readout.replaceChildren(h("span", { class: "ladder__hint" }, "Compare up to four plans. Remove one first."));
      });
      return dot;
    });
    return h("div", { class: "lane" }, [
      h("div", { class: "lane__name" }, [vendorBadge(list[0].platformId, vendor), h("span", { title: vendor }, vendor.replace(/\s*\(.*\)/, ""))]),
      h("div", { class: "lane__track" }, dots),
    ]);
  });

  const root = h("div", { class: "ladder" }, [
    readout,
    h("div", { class: "ladder__scroll" }, [
      h("div", { class: "ladder__inner" }, [
        h("div", { class: "lane lane--axis" }, [h("div", { class: "lane__name" }), h("div", { class: "lane__track" }, axis)]),
        h("div", { class: "ladder__body" }, [
          h("div", { class: "ladder__gridwrap" }, [h("div", { class: "lane__name" }), grid]),
          ...rows,
        ]),
      ]),
    ]),
    h("div", { class: "ladder__legend" }, [
      h("span", null, [h("i", { class: "key key--paid" }), "Paid plan"]),
      h("span", null, [h("i", { class: "key key--free" }), "Free plan"]),
      h("span", null, [h("i", { class: "key key--picked" }), "In your comparison"]),
      h("span", { class: "ladder__scale" }, "Price scale compresses toward the right so cheap plans stay legible."),
    ]),
  ]);

  selection.subscribe(() => {
    root.querySelectorAll<HTMLButtonElement>(".dot").forEach((d) => {
      const on = selection.has(d.dataset.plan ?? "");
      d.classList.toggle("is-picked", on);
      d.setAttribute("aria-pressed", String(on));
    });
  });
  return root;
}

export interface Pick { title: string; big: string; line: string; action: string; detail?: Record<string, unknown> }

/** Four starting points computed from the data; each one pre-sets the comparison list. */
export function computePicks(ctx: Ctx): Pick[] {
  const live = ctx.plans.filter((p) => p.status === "active" || p.status === "sold-out-daily");
  const paid = live.filter((p) => (p.monthlyUsd ?? 0) > 0).sort((a, b) => a.monthlyUsd! - b.monthlyUsd!);
  const credit = live.filter((p) => p.creditRatio != null).sort((a, b) => b.creditRatio! - a.creditRatio!)[0];
  const free = live.filter((p) => p.monthlyUsd === 0);
  const cheapApi = [...ctx.api].sort((a, b) => a.blendedUsd - b.blendedUsd)[0];
  const picks: Pick[] = [];
  if (paid[0]) picks.push({ title: "Lowest-priced paid plan", big: ctx.fmt(paid[0].monthlyUsd), line: `${paid[0].name} · ${paid[0].vendor}`, action: "See paid plans", detail: { sort: "price-asc", kind: "paid" } });
  if (credit) picks.push({ title: "Most credit for the money", big: `${credit.creditRatio!.toFixed(1)}×`, line: `${credit.name} includes ${ctx.fmt(credit.includedCreditUsd)} of usage for ${ctx.fmt(credit.monthlyUsd)}`, action: "Sort by credit", detail: { sort: "credit", kind: "all" } });
  picks.push({ title: "Free to start", big: String(free.length), line: `${new Set(free.map((p) => p.vendor)).size} providers offer a free tier`, action: "See free plans", detail: { sort: "price-asc", kind: "free" } });
  if (cheapApi) picks.push({ title: "Cheapest API rate", big: `${ctx.fmt(cheapApi.blendedUsd)}`, line: `${cheapApi.model} · per 1M tokens, blended`, action: "Rank APIs by cost", detail: { api: true } });
  return picks;
}

export function renderPicks(ctx: Ctx): HTMLElement {
  return h("div", { class: "picks" }, computePicks(ctx).map((p) => {
    const link = h("a", { class: "pick", href: p.detail?.api ? "#api" : "#plans" }, [
      h("span", { class: "pick__title" }, p.title),
      h("strong", { class: "pick__big" }, p.big),
      h("span", { class: "pick__line" }, p.line),
      h("span", { class: "pick__action" }, p.action),
    ]);
    link.addEventListener("click", () => { if (!p.detail?.api) window.dispatchEvent(new CustomEvent("tp:filter", { detail: p.detail })); });
    return link;
  }));
}
