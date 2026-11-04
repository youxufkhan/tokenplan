/** Number formatting shared site-wide; do not reimplement it in components. */

const usd = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const usdTiny = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6, minimumFractionDigits: 2 });
const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Costs under one cent keep up to six decimals; tiny positive values never show as $0.00. */
export const money = (v: number | null | undefined) => {
  if (v == null) return "—";
  if (v !== 0 && Math.abs(v) < 0.000001) return `${v < 0 ? "−" : ""}$<0.000001`;
  return `$${Math.abs(v) < 0.01 && v !== 0 ? usdTiny.format(v) : usd.format(v)}`;
};

export const moneyCompact = (v: number | null | undefined) => {
  if (v == null) return "—";
  if (v !== 0 && Math.abs(v) < 0.01) return money(v);
  if (v >= 10000) return `$${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `$${v >= 1000 ? usd.format(v) : v.toFixed(v < 10 ? 2 : 0)}`;
};

export const num = (v: number | null | undefined) => (v == null ? "—" : int.format(v));

export const pct = (v: number | null | undefined) => (v == null ? "—" : `${(v * 100).toFixed(0)}%`);

export const PERIOD: Record<string, string> = { month: "/mo", quarter: "/quarter", year: "/yr", week: "/wk", none: "" };


export const KIND: Record<string, string> = {
  "coding-plan": "Coding Plan",
  "token-plan": "Token Plan",
  ide: "IDE",
  free: "Free",
};

export const STATUS: Record<string, string> = {
  active: "Available",
  "sold-out-daily": "Limited daily",
  discontinued: "Discontinued",
  "coming-soon": "Coming soon",
  unknown: "Unverified",
  "no-plan": "No subscription",
};

export const CONFIDENCE: Record<string, string> = { high: "Verified", medium: "Partially verified", low: "Unverified" };

/** Bar width relative to the most expensive entry, for table visuals without a chart library. */
export const barWidth = (value: number | null, max: number) =>
  value == null || !max ? 0 : Math.max(2, Math.round((value / max) * 100));

const pkrPrecise = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
});

const pkr = new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", currencyDisplay: "code", maximumFractionDigits: 2 });

export const currencyMoney = (value: number, currency: "USD" | "PKR") =>
  currency === "USD" ? money(value) : (Math.abs(value) < 0.01 ? pkrPrecise : pkr).format(value);

export const shortDate = (iso?: string) => {
  if (!iso) return "date unknown";
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
};
