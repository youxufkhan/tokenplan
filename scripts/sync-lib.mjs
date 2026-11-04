/** Shared helpers for the data sync scripts. Pure functions are unit-tested; I/O stays thin. */
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";

const dataUrl = (name) => new URL(`../data/${name}`, import.meta.url);
export const readData = (name) => JSON.parse(readFileSync(dataUrl(name), "utf8"));
export const writeData = (name, value) => writeFileSync(dataUrl(name), `${JSON.stringify(value, null, 2)}\n`);
export const today = () => new Date().toISOString().slice(0, 10);

/** Problems a human should look at; the workflow turns this file into a GitHub issue. */
const REPORT = process.env.SYNC_REPORT ?? new URL("../.sync-report.md", import.meta.url).pathname;
export const report = (line) => { console.warn(`! ${line}`); appendFileSync(REPORT, `- ${line}\n`); const path = new URL("../.sync-report.json", import.meta.url); const rows = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : []; rows.push({ observedAt: new Date().toISOString(), message: line }); writeFileSync(path, JSON.stringify(rows, null, 2)); };

export async function fetchText(url, timeout = 20_000) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; TokenPlanSync/1.0)", accept: "text/html,application/json" },
    signal: AbortSignal.timeout(timeout),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** "Rs 1,400.00" / "$19.99" / "AED 73.99" -> number. */
export const parseAmount = (text) => {
  const m = /(\d[\d,]*(?:\.\d+)?)/.exec(text ?? "");
  return m ? Number(m[1].replace(/,/g, "")) : null;
};

/** App Store product pages are server-rendered; the in-app purchase list is embedded as label/price pairs. */
export function parseIap(html) {
  const out = [];
  for (const m of html.matchAll(/"leadingText":"((?:[^"\\]|\\.)*)","trailingText":"((?:[^"\\]|\\.)*)"/g)) {
    const amount = parseAmount(m[2]);
    if (amount != null) out.push({ label: JSON.parse(`"${m[1]}"`), amount, currency: /^(?:\$|USD)/.test(m[2]) ? "USD" : /^(?:Rs|PKR)/.test(m[2]) ? "PKR" : /^(?:AED)/.test(m[2]) ? "AED" : /^(?:SAR)/.test(m[2]) ? "SAR" : null, period: /monthly|per month/i.test(m[1]) ? "month" : /annual|year/i.test(m[1]) ? "year" : null });
  }
  return out;
}

export const withinBand = (next, prev, pct) => prev > 0 && Math.abs(next - prev) / prev <= pct;

/** Entries with this label whose price is plausibly the same product; the label alone can repeat (annual vs monthly). */
export const pickPrice = (iap, label, current, pct = 0.4) => {
  const found = iap.filter((x) => x.label === label && withinBand(x.amount, current, pct));
  const unique = [...new Set(found.map((x) => x.amount))];
  return unique.length === 1 ? unique[0] : null;
};

const visibleText = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ");

/** Every number on a page, normalised, for "is the recorded price still shown" checks. */
export function pageNumbers(html) {
  return new Set([...visibleText(html).matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, ""))));
}

/** A page that shows fewer than three dollar prices is script-rendered or localised, so it cannot confirm or refute a USD price. */
export const showsUsdPrices = (html) => (visibleText(html).match(/\$\s?\d/g) ?? []).length >= 3;

/** FX guard: finite, positive and within the band of the previous value. */
export const validRate = (next, prev, pct = 0.05) =>
  Number.isFinite(next) && next > 0 && (prev == null || withinBand(next, prev, pct));

export function logChange(entry) {
  const history = readData("price-history.json");
  if (history.some((row) => row.id === entry.id && row.date === today() && row.from === entry.from && row.to === entry.to && row.currency === entry.currency)) return;
  history.push({ date: today(), ...entry });
  writeData("price-history.json", history);
}
