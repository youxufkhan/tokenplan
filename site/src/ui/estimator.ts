import { estimateApiCost } from "../estimate";
import type { UsdApi } from "../types";
import { h } from "./dom";
import { money } from "./format";

export function renderEstimator(prices: UsdApi[], format: typeof money): HTMLElement {
  const offers = prices.filter((price) => price.confidence !== "low");
  if (!offers.length) return h("p", null, "No API quotes are available for estimation.");

  const model = h("select", null, offers.map((offer, index) =>
    h("option", { value: String(index) }, `${offer.model} (${offer.vendor})`)));
  const input = h("input", { type: "number", min: "0", step: "any", value: "10" });
  const output = h("input", { type: "number", min: "0", step: "any", value: "2" });
  const cache = h("input", { type: "number", min: "0", max: "100", step: "any", value: "0" });
  const result = h("output", { class: "estimator__total", "aria-live": "polite" });
  const source = h("a", { target: "_blank", rel: "noopener noreferrer" }, "Check quote and billing terms");
  const field = (name: string, control: HTMLElement) => h("label", { class: "field" }, [name, control]);
  const update = () => {
    const quote = offers[model.selectedIndex];
    cache.disabled = quote.cacheHitUsd == null;
    if (cache.disabled) cache.value = "0";
    const total = estimateApiCost(quote, input.valueAsNumber, output.valueAsNumber, cache.valueAsNumber);
    result.textContent = total == null ? "Enter valid usage amounts" : format(total);
    source.href = quote.sourceUrl ?? "#api";
  };

  const panel = h("div", { class: "estimator" }, [
    field("Model quote", model),
    h("div", { class: "estimator__inputs" }, [
      field("Input (million tokens)", input),
      field("Output (million tokens)", output),
      field("Cached input (%)", cache),
    ]),
    h("div", { class: "estimator__summary" }, [h("span", null, "Estimated monthly spend"), result, source]),
    h("p", { class: "detail-note" }, "Uses the selected quote’s listed rates. Cache writes, tools, tax and usage tiers can change the final bill."),
  ]);
  panel.addEventListener("input", update);
  panel.addEventListener("change", update);
  update();
  return panel;
}
