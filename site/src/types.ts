/** Site types: usd.json (derived) merged with the raw data (details). */


export interface UsdPlan {
  id: string;
  vendor: string;
  name: string;
  region: "global";
  kind: string;
  originalCurrency: "USD";
  monthlyUsd: number | null;
  firstPeriodUsd: number | null;
  includedCreditUsd: number | null;
  creditRatio: number | null;
  confidence: "high" | "medium" | "low";
  status: string;
  platformId: string | null;
  offering: "first-party" | "cloud-platform" | "tool-vendor" | "reseller" | null;
  offeringLabel: string | null;
  bundle: "model-access" | "tool" | null;
  bundleLabel: string | null;
  platformUrl: string | null;
  // Details from plans.json
  quota?: string;
  models?: string[];
  buyUrl?: string | null;
  sourceUrl?: string;
  verifiedAt?: string;
  notes?: string | null;
  multimodal?: boolean | null;
}

export interface UsdApi {
  id: string;
  vendor: string;
  model: string;
  region: "global";
  originalCurrency: "USD";
  inputUsd: number;
  outputUsd: number;
  cacheHitUsd: number | null;
  blendedUsd: number;
  confidence: "high" | "medium" | "low";
  platformId: string | null;
  offering: "first-party" | "cloud-platform" | "tool-vendor" | "reseller" | null;
  offeringLabel: string | null;
  platformUrl: string | null;
  context?: string | null;
  tiering?: string | null;
  sourceUrl?: string;
  buyUrl?: string;
  verifiedAt?: string;
  notes?: string | null;
}

export interface UsdModel {
  model: string;
  creator: string;
  openWeights: boolean;
  agenticIndex: number | null;
  costPerTaskUsd: number | null;
  valuePerUsd: number | null;
  inputUsd: number | null;
  outputUsd: number | null;
}

export interface Platform {
  id: string;
  name: string;
  url: string;
  offering: "first-party" | "cloud-platform" | "tool-vendor" | "reseller";
  bundle: "model-access" | "tool";
  note: string;
}

export interface PlatformsFile {
  offeringDefs: Record<string, { label: string; desc: string }>;
  bundleDefs: Record<string, { label: string; desc: string }>;
  platforms: Platform[];
}

export interface UsdView {
  method: Record<string, string>;
  highlights: {
    plans: { cheapest: string[]; priciest: string[]; mostCredit: string[] };
    api: { cheapest: string[]; priciest: string[] };
    models: { bestValue: string[]; cheapestPerTask: string[] };
  };
  plans: UsdPlan[];
  api: UsdApi[];
  models: UsdModel[];
}

export interface RawPlan {
  id: string;
  quota: string;
  models?: string[];
  buyUrl?: string | null;
  sourceUrl: string;
  verifiedAt: string;
  notes?: string | null;
  multimodal?: boolean | null;
  price: { note?: string | null };
  includedCredit?: { text?: string } | null;
}

export interface RawApi {
  id: string;
  context?: string | null;
  tiering?: string | null;
  sourceUrl: string;
  buyUrl: string;
  verifiedAt: string;
  notes?: string | null;
}
