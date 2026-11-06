/** Page copy shared by the live app and the build-time prerender (site/seo.ts), so both say the same thing. */
import type { Market } from "./ui/ctx";

export const SITE = "https://aiplanpricing.yousufkhan.uk";

export const COUNTRY: Record<Market, string> = { US: "the US", PK: "Pakistan", AE: "the UAE", SA: "Saudi Arabia" };
export const PATH: Record<Market, string> = { US: "/", PK: "/pk/", AE: "/ae/", SA: "/sa/" };
export const LANG: Record<Market, string> = { US: "en-US", PK: "en-PK", AE: "en-AE", SA: "en-SA" };

export const heading = (m: Market) =>
  m === "US" ? "AI coding plan prices, compared on one line" : `AI coding plan prices in ${COUNTRY[m]}, compared on one line`;

export const lede = (plans: number, vendors: number) =>
  `${plans} subscriptions from ${vendors} providers, including Claude, ChatGPT, Cursor, GitHub Copilot and Gemini.`;

/** Latest ISO date in a list; used for the visible "last checked" line, sitemap lastmod and dateModified. */
export const latest = (dates: Array<string | null | undefined>) => dates.filter((d): d is string => !!d).map((d) => d.slice(0, 10)).sort().at(-1) ?? "";

export const longDate = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

export const METHOD_TITLE = "How prices are checked";
export const METHOD = [
  "Every plan and API rate links to the provider's own pricing page, shown as Source. A daily job re-reads those pages and flags any price that changed, and each entry shows the date its price was last verified. Entries are marked Verified, Partially verified or Unverified.",
  "Monthly prices are the regular price: annual plans are divided by 12, quarterly plans by 3 and weekly plans multiplied by 52/12. First-period discounts are shown separately and never used for ranking.",
  "Pakistan, UAE and Saudi views convert the USD list price at that day's reference exchange rate, so they are estimates. Where a plan is sold in the local Apple App Store, the storefront price is recorded separately with its difference from the converted list price, because App Store prices usually include tax and a premium.",
  "API costs are per million tokens. The workload estimate prices uncached input, cached input and output separately; the single blended rate weights input and output 3:1. Benchmark scores are Artificial Analysis results via ModelGo.",
];
export const ABOUT =
  "Built and maintained by Yousuf Khan, a software developer who uses these tools daily. The data is open: the JSON files under /data are published under CC BY 4.0, and corrections are welcome as GitHub issues.";
