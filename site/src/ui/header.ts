/** Site header: brand, section links, market switch and theme toggle. */
import { h } from "./dom";
import { MARKETS, type Market } from "./ctx";

const THEME_KEY = "tokenplan-theme";
type Theme = "light" | "dark";

const currentTheme = (): Theme => {
  const set = document.documentElement.dataset.theme;
  return set === "light" || set === "dark" ? set : "light";
};
const applyTheme = (t: Theme) => {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(THEME_KEY, t); } catch { /* private mode: keep the choice for this visit only */ }
};

const SECTIONS: [string, string][] = [["plans", "Plans"], ["api", "API rates"], ["models", "Models"], ["providers", "Providers"]];
const MARK = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="15" fill="#202124"/><path d="M15 18h23l12 14-12 14H15z" fill="#f5b544"/><circle cx="39" cy="32" r="3" fill="#202124"/><path d="M22 26h7m-7 6h10m-10 6h7" stroke="#202124" stroke-width="4" stroke-linecap="round"/></svg>`;

export function renderHeader(market: Market): HTMLElement {
  const toggle = h("button", { class: "icon-btn", type: "button", "aria-label": "Switch between light and dark theme" }, currentTheme() === "dark" ? "Light" : "Dark");
  toggle.addEventListener("click", () => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    toggle.textContent = next === "dark" ? "Light" : "Dark";
  });
  const to = (m: string) => { const q = new URLSearchParams(location.search); q.set("market", m); return `?${q}`; };
  const seg = h("div", { class: "seg", role: "group", "aria-label": "Market" },
    (Object.keys(MARKETS) as Market[]).map((m) => h("a", { href: to(m.toLowerCase()), "aria-current": market === m ? "true" : null }, MARKETS[m].label)));
  seg.querySelectorAll<HTMLAnchorElement>("a").forEach((anchor, index) => {
    anchor.addEventListener("click", () => { anchor.href = to(Object.keys(MARKETS)[index].toLowerCase()); });
  });
  const nav = h("nav", { class: "nav", "aria-label": "Sections" }, SECTIONS.map(([id, label]) => h("a", { href: `#${id}`, "data-section": id }, label)));
  const links = new Map<string, HTMLAnchorElement>();
  nav.querySelectorAll<HTMLAnchorElement>("a").forEach((a) => links.set(a.dataset.section!, a));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) links.forEach((a, id) => a.toggleAttribute("aria-current", id === e.target.id));
  }, { rootMargin: "-90px 0px -65% 0px" });
  requestAnimationFrame(() => links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); }));
  return h("header", { class: "top" }, h("div", { class: "wrap top__in" }, [
    h("a", { class: "brand", href: "#top" }, [h("span", { class: "brand__mark", html: MARK }), h("span", null, "AI Plan Pricing")]),
    nav, seg, toggle,
  ]));
}
