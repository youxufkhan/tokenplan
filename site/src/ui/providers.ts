/** Who sells what: a compact registry with plan and API counts. */
import { h } from "./dom";
import { vendorBadge } from "./model-icons";
import type { PlatformsFile, UsdApi, UsdPlan } from "../types";

export function renderProviders(file: PlatformsFile, plans: UsdPlan[], api: UsdApi[]): HTMLElement {
  const rows = file.platforms
    .map((p) => ({ p, plans: plans.filter((x) => x.platformId === p.id).length, api: api.filter((x) => x.platformId === p.id).length }))
    .sort((a, b) => b.plans + b.api - (a.plans + a.api));
  return h("div", { class: "providers" }, rows.map(({ p, plans: np, api: na }) =>
    h("a", { class: "provider", href: p.url, target: "_blank", rel: "noopener noreferrer" }, [
      vendorBadge(p.id, p.name),
      h("div", null, [h("h3", null, p.name), h("p", null, `${file.offeringDefs[p.offering]?.label ?? p.offering} · ${np} plans · ${na} API models`)]),
    ])));
}
