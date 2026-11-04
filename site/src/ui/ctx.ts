/** Shared page context: market, currency formatting and merged data used by every section. */
import type { PlatformsFile, UsdApi, UsdModel, UsdPlan } from "../types";
import { currencyMoney, money, moneyCompact } from "./format";

export interface Quote {
  market: "US" | "PK";
  planId: string;
  amount: number;
  currency: "USD" | "PKR";
  channel: string;
  sourceUrl: string;
  verifiedAt: string;
}

export interface Ctx {
  market: "US" | "PK";
  currency: "USD" | "PKR";
  rate: number;
  rateDate: string;
  fmt: (usd: number | null | undefined) => string;
  fmtCompact: (usd: number | null | undefined) => string;
  plans: UsdPlan[];
  api: UsdApi[];
  models: UsdModel[];
  platforms: PlatformsFile;
  quotes: Map<string, Quote>;
}

export function makeFormatters(market: "US" | "PK", rate: number) {
  if (market === "US") return { fmt: money, fmtCompact: moneyCompact };
  const fmt = (usd: number | null | undefined) => {
    if (usd == null) return "—";
    const local = usd * rate;
    return `≈ ${local >= 100 ? currencyMoney(Math.round(local), "PKR").replace(/\.00$/, "") : currencyMoney(local, "PKR")}`;
  };
  const fmtCompact = (usd: number | null | undefined) => {
    if (usd == null) return "—";
    const local = usd * rate;
    return local >= 1000 ? `PKR ${(local / 1000).toFixed(local >= 10000 ? 0 : 1)}K` : `PKR ${Math.round(local)}`;
  };
  return { fmt, fmtCompact };
}
