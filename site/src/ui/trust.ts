import { shortDate } from "./format";

export function reviewText(item: { verifiedAt?: string; priceVerifiedAt?: string }): string {
  const date = item.priceVerifiedAt ?? item.verifiedAt;
  const stale = date && Date.now() - new Date(date).getTime() > 90 * 86400000;
  return `Record reviewed ${shortDate(item.verifiedAt)}${item.priceVerifiedAt ? ` · Price verified ${shortDate(item.priceVerifiedAt)}` : ""}${stale ? " · Price older than 90 days; check the source" : ""}`;
}
