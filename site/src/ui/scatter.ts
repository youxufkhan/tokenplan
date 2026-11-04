/** Benchmark score against cost per task, with the efficient frontier drawn through the best trade-offs. */
import { h } from "./dom";
import type { UsdModel } from "../types";
import { money } from "./format";

const NS = "http://www.w3.org/2000/svg";
const el = (tag: string, attrs: Record<string, string>, text?: string) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text) node.textContent = text;
  return node;
};

export function renderScatter(models: UsdModel[]): HTMLElement {
  const pts = models.filter((m) => m.agenticIndex != null && m.costPerTaskUsd != null && m.costPerTaskUsd > 0) as (UsdModel & { agenticIndex: number; costPerTaskUsd: number })[];
  if (!pts.length) return h("div", { class: "empty" }, "Benchmark data is unavailable right now.");
  const W = 900, H = 470, L = 56, R = 24, T = 28, B = 52;
  const minC = Math.min(...pts.map((p) => p.costPerTaskUsd)), maxC = Math.max(...pts.map((p) => p.costPerTaskUsd));
  const minY = Math.floor(Math.min(...pts.map((p) => p.agenticIndex)) / 5) * 5, maxY = Math.ceil(Math.max(...pts.map((p) => p.agenticIndex)) / 5) * 5;
  const lo = Math.log10(minC), hi = Math.log10(maxC);
  const x = (c: number) => L + ((Math.log10(c) - lo) / (hi - lo || 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - minY) / (maxY - minY || 1)) * (H - T - B);

  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `${pts.length} models by cost per task and Agentic Index; higher and further left is better` });
  for (let v = minY; v <= maxY; v += 10) {
    svg.append(el("line", { x1: String(L), x2: String(W - R), y1: String(y(v)), y2: String(y(v)), class: "grid" }));
    svg.append(el("text", { x: String(L - 8), y: String(y(v) + 4), class: "tick", "text-anchor": "end" }, String(v)));
  }
  for (const c of [0.1, 0.3, 1, 3, 10, 30, 100].filter((c) => c >= minC * 0.9 && c <= maxC * 1.1)) {
    svg.append(el("line", { x1: String(x(c)), x2: String(x(c)), y1: String(T), y2: String(H - B), class: "grid" }));
    svg.append(el("text", { x: String(x(c)), y: String(H - B + 18), class: "tick", "text-anchor": "middle" }, money(c)));
  }
  svg.append(el("text", { x: String((L + W - R) / 2), y: String(H - 8), class: "axis", "text-anchor": "middle" }, "Cost per task, log scale: cheaper to the left"));
  svg.append(el("text", { x: "14", y: "12", class: "axis" }, "Agentic Index: higher is better"));

  // Efficient frontier: no other model is both cheaper and scores higher.
  const byCost = [...pts].sort((a, b) => a.costPerTaskUsd - b.costPerTaskUsd);
  const frontier: typeof pts = [];
  for (const p of byCost.filter((q) => q.agenticIndex >= 20)) if (!frontier.length || p.agenticIndex > frontier[frontier.length - 1].agenticIndex) frontier.push(p);
  svg.append(el("polyline", { points: frontier.map((p, i) => `${i ? x(p.costPerTaskUsd) : x(p.costPerTaskUsd)},${y(p.agenticIndex)}`).join(" "), class: "frontier" }));

  const onFrontier = new Set(frontier);
  const readout = h("p", { class: "scatter__readout", "aria-live": "polite" }, "Hover or focus a point to read it. Labeled points are the efficient frontier.");
  for (const p of pts) {
    const dot = el("circle", { cx: String(x(p.costPerTaskUsd)), cy: String(y(p.agenticIndex)), r: onFrontier.has(p) ? "6" : "4", class: `pt${p.openWeights ? " pt--open" : ""}${onFrontier.has(p) ? " pt--front" : ""}`, tabindex: "0" });
    const say = () => { readout.textContent = `${p.model} · ${p.creator} · Agentic Index ${p.agenticIndex} · ${money(p.costPerTaskUsd)} per task${p.openWeights ? " · open weights" : ""}`; };
    dot.addEventListener("mouseenter", say); dot.addEventListener("focus", say);
    svg.append(dot);
  }
  const seen = new Set<string>();
  const placed: [number, number][] = [];
  for (const p of frontier) {
    const name = p.model.replace(/\s*\(.*\)$/, "");
    if (seen.has(name) || seen.size >= 8) continue;
    const px = x(p.costPerTaskUsd), py = y(p.agenticIndex);
    if (placed.some(([qx, qy]) => Math.abs(qx - px) < 150 && Math.abs(qy - py) < 16)) continue;
    placed.push([px, py]);
    seen.add(name);
    const right = x(p.costPerTaskUsd) > W * 0.72;
    svg.append(el("text", { x: String(x(p.costPerTaskUsd) + (right ? -9 : 9)), y: String(y(p.agenticIndex) - 9), class: "plabel", "text-anchor": right ? "end" : "start" }, name));
  }

  return h("figure", { class: "scatter" }, [svg,
    h("div", { class: "ladder__legend" }, [
      h("span", null, [h("i", { class: "key key--paid" }), "Closed weights"]),
      h("span", null, [h("i", { class: "key key--open" }), "Open weights"]),
      h("span", null, [h("i", { class: "key key--line" }), "Efficient frontier"]),
    ]), readout]);
}
