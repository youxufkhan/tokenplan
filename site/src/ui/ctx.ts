/** Shared page context: market, currency formatting and merged data used by every section. */
import type { PlatformsFile, UsdApi, UsdModel, UsdPlan } from "../types";
import { money, moneyCompact } from "./format";

export type Market = "US" | "PK" | "AE" | "SA";
export type Currency = "USD" | "PKR" | "AED" | "SAR";

/** One row per storefront; the order is the order of the market switch. */
export const MARKETS: Record<Market, { label: string; currency: Currency }> = {
  US: { label: "US · USD", currency: "USD" },
  PK: { label: "Pakistan · PKR", currency: "PKR" },
  AE: { label: "UAE · AED", currency: "AED" },
  SA: { label: "Saudi · SAR", currency: "SAR" },
};

export interface Quote {
  market: Market;
  planId: string;
  amount: number;
  currency: Currency;
  channel: string;
  sourceUrl: string;
  verifiedAt: string;
}

export interface Ctx {
  market: Market;
  currency: Currency;
  rate: number;
  rateDate: string;
  fmt: (usd: number | null | undefined) => string;
  fmtCompact: (usd: number | null | undefined) => string;
  /** Format a recorded local quote in its own currency. */
  fmtQuote: (q: Quote) => string;
  /** How far a local quote sits above (+) or below (-) the converted USD list price, in percent. */
  premium: (q: Quote, listUsd: number | null | undefined) => number | null;
  plans: UsdPlan[];
  api: UsdApi[];
  models: UsdModel[];
  platforms: PlatformsFile;
  quotes: Map<string, Quote[]>;
}

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const small = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 });

export function makeFormatters(currency: Currency, rate: number) {
  if (currency === "USD") return { fmt: money, fmtCompact: moneyCompact };
  const fmt = (usd: number | null | undefined) => {
    if (usd == null) return "—";
    const local = usd * rate;
    return `≈ ${currency} ${local >= 100 ? whole.format(local) : local >= 0.01 ? cents.format(local) : small.format(local)}`;
  };
  const fmtCompact = (usd: number | null | undefined) => {
    if (usd == null) return "—";
    const local = usd * rate;
    return local >= 1000 ? `${currency} ${(local / 1000).toFixed(local >= 10000 ? 0 : 1)}K` : `${currency} ${Math.round(local)}`;
  };
  return { fmt, fmtCompact };
}

export const quoteText = (q: Quote) => q.currency === "USD" ? `$${cents.format(q.amount)}` : `${q.currency} ${q.amount % 1 ? cents.format(q.amount) : whole.format(q.amount)}`;

/** Preserve separately sold channels instead of silently replacing one quote with another. */
export function groupQuotes(quotes: Quote[], market: Market): Map<string, Quote[]> {
  const grouped = new Map<string, Quote[]>();
  for (const quote of quotes.filter((q) => q.market === market)) {
    const offers = grouped.get(quote.planId) ?? [];
    offers.push(quote);
    grouped.set(quote.planId, offers);
  }
  return grouped;
}
