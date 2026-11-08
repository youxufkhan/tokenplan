import { reviewText } from "./trust";
/** Sticky tray plus a side-by-side dialog for the plans the reader picked. */
import { h, clear } from "./dom";
import type { Ctx } from "./ctx";
import { savedPanel } from "./saved";
import { selection } from "./store";
import { CONFIDENCE, KIND, shortDate } from "./format";
import type { UsdPlan } from "../types";

export function renderCompare(ctx: Ctx): HTMLElement {
  const byId = new Map(ctx.plans.map((p) => [p.id, p]));
  const chips = h("div", { class: "tray__chips" });
  const open = h("button", { type: "button", class: "btn btn--solid" }, "Compare side by side");
  const clearBtn = h("button", { type: "button", class: "btn btn--ghost" }, "Clear");
  const tray = h("div", { class: "tray", hidden: true, role: "region", "aria-label": "Plans to compare" }, [chips, h("div", { class: "tray__actions" }, [clearBtn, open])]);
  const dialog = h("dialog", { class: "cmp", "aria-label": "Plan comparison" });

  const field = (label: string, cell: (p: UsdPlan) => Node | string | null, best?: (p: UsdPlan) => boolean) => ({ label, cell, best });
  const rows = (plans: UsdPlan[]) => {
    const cheapest = Math.min(...plans.map((p) => p.monthlyUsd ?? Infinity));
    const quotes = (p: UsdPlan) => ctx.quotes.get(p.id) ?? [];
    return [
      field("Monthly price", (p) => p.monthlyUsd === 0 ? "Free" : ctx.fmt(p.monthlyUsd), (p) => p.monthlyUsd === cheapest),
      field("Regional offers", (p) => quotes(p).map((q) => `${q.channel}: ${ctx.fmtQuote(q)}`).join("; ") || "Not recorded"),
      field("Reference channel", (p) => p.channel ?? "Web"),
      field("Fees", (p) => p.fees ?? "See provider"),

      field("First period", (p) => p.firstPeriodUsd != null ? ctx.fmt(p.firstPeriodUsd) : "Same as regular"),
      field("Included usage credit", (p) => p.includedCreditUsd != null ? `${ctx.fmt(p.includedCreditUsd)} (${p.creditRatio?.toFixed(1)}× the price)` : "None listed"),
      field("Limits", (p) => p.quota ?? "See provider"),
      field("Models", (p) => (p.models ?? []).join(", ") || "See provider"),
      field("Type", (p) => `${KIND[p.kind] ?? p.kind}${p.offeringLabel ? ` · ${p.offeringLabel}` : ""}`),
      field("Verification", (p) => `${CONFIDENCE[p.confidence] ?? "Unverified"}, ${reviewText(p)}`),
      field("Links", (p) => h("span", { class: "cmp__links" }, [
        p.buyUrl ? h("a", { href: p.buyUrl, target: "_blank", rel: "noopener noreferrer" }, "Buy") : null,
        p.sourceUrl ? h("a", { href: p.sourceUrl, target: "_blank", rel: "noopener noreferrer" }, "Source") : null,
      ])),
    ];
  };

  function paintDialog() {
    const plans = selection.ids().map((id) => byId.get(id)).filter((p): p is UsdPlan => !!p);
    clear(dialog);
    const close = h("button", { type: "button", class: "btn btn--ghost", "aria-label": "Close comparison" }, "Close");
    close.addEventListener("click", () => dialog.close());
    dialog.append(h("header", { class: "cmp__head" }, [h("h2", null, "Side by side"), close]),
      h("div", { class: "cmp__scroll" }, h("table", null, [
        h("thead", null, h("tr", null, [h("th", { scope: "col" }, ""), ...plans.map((p) => h("th", { scope: "col" }, [h("span", null, p.name), h("small", null, p.vendor)]))])),
        h("tbody", null, rows(plans).map((r) => h("tr", null, [h("th", { scope: "row" }, r.label), ...plans.map((p) => h("td", { class: r.best?.(p) ? "is-best" : "" }, r.cell(p)))]))),
      ])));
  }

  function paint() {
    const ids = selection.ids();
    tray.hidden = ids.length === 0;
    clear(chips);
    chips.append(h("span", { class: "tray__label" }, `${ids.length} selected`));
    for (const id of ids) {
      const p = byId.get(id);
      if (!p) continue;
      const x = h("button", { type: "button", class: "tag tag--x", "aria-label": `Remove ${p.name}` }, `${p.name} ×`);
      x.addEventListener("click", () => selection.toggle(id));
      chips.append(x);
    }
    open.disabled = ids.length < 2;
    open.title = ids.length < 2 ? "Pick at least two plans" : "";
    if (dialog.open) { ids.length < 2 ? dialog.close() : paintDialog(); }
  }
  open.addEventListener("click", () => { paintDialog(); dialog.showModal(); });
  clearBtn.addEventListener("click", () => selection.clear());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  selection.subscribe(paint);

  const notice = h("p", { role: "status" });
  const saves = savedPanel<string[]>("comparisons", () => selection.ids(), (ids) => {
    const remaining = ids.filter((id) => byId.has(id));
    notice.textContent = remaining.length < ids.length ? "Some saved plans are no longer available and were removed." : "Comparison loaded.";
    selection.set(remaining);
  }, (value): value is string[] => Array.isArray(value) && value.length > 0 && value.length <= 4 && value.every((id) => typeof id === "string"));
  const fromUrl = new URLSearchParams(location.search).get("cmp");
  if (fromUrl) selection.set(fromUrl.split(",").filter((id) => byId.has(id)));
  paint();
  selection.subscribe(() => {
    const next = new URLSearchParams(location.search);
    selection.ids().length ? next.set("cmp", selection.ids().join(",")) : next.delete("cmp");
    history.replaceState(null, "", `${location.pathname}${next.size ? `?${next}` : ""}${location.hash}`);
  });
  return h("div", { class: "cmpwrap" }, [h("div", { class: "wrap saved-comparisons" }, [h("h2", null, "Saved comparisons"), saves, notice]), tray, dialog]);
}
