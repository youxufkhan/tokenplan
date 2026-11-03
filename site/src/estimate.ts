import type { UsdApi } from "./types";

export function estimateApiCost(
  rates: Pick<UsdApi, "inputUsd" | "outputUsd" | "cacheHitUsd">,
  inputMillions: number,
  outputMillions: number,
  cachedPercent: number,
): number | null {
  if (![inputMillions, outputMillions, cachedPercent].every((value) => Number.isFinite(value) && value >= 0)
    || cachedPercent > 100 || (cachedPercent > 0 && rates.cacheHitUsd == null)) return null;

  const cached = inputMillions * cachedPercent / 100;
  const total = (inputMillions - cached) * rates.inputUsd
    + cached * (rates.cacheHitUsd ?? 0)
    + outputMillions * rates.outputUsd;
  return Number.isFinite(total) ? total : null;
}
