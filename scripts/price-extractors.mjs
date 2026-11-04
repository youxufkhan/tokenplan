/** Conservative product-scoped extractors. Unsupported markup stays unverified. */
export function guardPrice(next, previous) {
  return Number.isFinite(next) && next >= 0 && (next === previous
    || (previous > 0 && next > 0 && Math.abs(next - previous) / previous <= 0.4));
}

const text = (html) => html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
  .replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();

export function extractSubscription(html, entry) {
  const host = new URL(entry.sourceUrl).hostname;
  const claude = host === "claude.com";
  const copilot = host === "github.com" && new URL(entry.sourceUrl).pathname === "/features/copilot/plans";
  if (!claude && !copilot) return { status: "unsupported", evidence: "No product-specific extractor" };
  if (entry.price.currency !== "USD" || entry.price.period !== "month")
    return { status: "unsupported", evidence: "Extractor supports regular monthly USD prices only" };
  const names = claude
    ? { "claude-free": "Free", "claude-pro": "Pro", "claude-max": "Max", "claude-ultra": "Ultra" }
    : { "copilot-free": "Free", "copilot-pro": "Pro", "copilot-pro-plus": "Pro+", "copilot-max": "Max" };
  const name = names[entry.id];
  if (!name) return { status: "unsupported", evidence: "Unknown product identity" };
  const blocks = [...html.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>([\s\S]*?)(?=<h[23]\b|$)/gi)]
    .filter((m) => text(m[1]) === name).map((m) => text(m[2]));
  const candidates = [];
  for (const block of blocks) {
    if (/\b(promo|introductory|first month|limited.time)\b/i.test(block)) continue;
    let match;
    if (name === "Free") match = /\$\s*(0)(?:\.00)?\b/.exec(block);
    else if (claude && name === "Pro") match = /\$\s*([\d,.]+)\s+if billed monthly/i.exec(block);
    else match = copilot
      ? /\$\s*([\d,.]+)\s+USD per user\s*\/\s*month/i.exec(block)
      : /\$\s*([\d,.]+)\s+Per month\b/i.exec(block);
    if (match) candidates.push({ amount: Number(match[1].replace(/,/g, "")), evidence: block.slice(0, 600) });
  }
  if (candidates.length !== 1) return { status: "ambiguous", evidence: "Expected one explicit product and monthly billing match" };
  return { status: candidates[0].amount === entry.price.amount ? "exact-match" : "changed-price", ...candidates[0] };
}

export function matchStorePrice(iap, quote) {
  const storefront = { US: "us", PK: "pk", AE: "ae", SA: "sa" }[quote.market];
  if (new URL(quote.sourceUrl).pathname.split("/")[1] !== storefront) return null;
  const matches = iap.filter((item) => item.label === quote.match && item.currency === quote.currency
    && (item.period === "month" || (quote.productId && item.productId === quote.productId && quote.period === "month")));
  return matches.length === 1 ? matches[0] : null;
}
