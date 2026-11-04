/** Local LobeHub icons: platforms by stable id, APIs by model family; license in site/public/model-icons. */
import { h } from "./dom";

const PROVIDERS = new Map<string, string>([
  ["anthropic", "anthropic"], ["openai", "openai"], ["google", "google-color"],
  ["xai", "xai"], ["deepseek", "deepseek-color"], ["zhipu", "zai"], ["zai", "zai"],
  ["moonshot", "kimi-color"], ["minimax", "minimax-color"], ["mistral", "mistral-color"],
  ["meta", "meta-color"], ["aliyun-bailian", "alibaba-color"],
  ["tencent-hunyuan", "tencent-color"], ["tencent-cloud", "tencent-color"],
]);
const FAMILIES: readonly [RegExp, string][] = [
  [/^claude(?=[\s\d-]|$)/i, "claude-color"],
  [/^gemini(?=[\s\d-]|$)/i, "gemini-color"],
  [/^gemma(?=[\s\d-]|$)/i, "gemma-color"],
  [/^qwen(?=[\s\d.-]|$)/i, "qwen-color"],
  [/^deepseek(?=[\s\d-]|$)/i, "deepseek-color"],
  [/^(?:gpt(?=[\s\d-]|$)|o[134](?=[\s-]|$))/i, "openai"],
  [/^glm(?=[\s\d-]|$)/i, "zai"],
  [/^grok(?=[\s\d-]|$)/i, "grok"],
  [/^kimi(?=[\s\d-]|$)/i, "kimi-color"],
  [/^minimax(?=[\s\d-]|$)/i, "minimax-color"],
  [/^mimo(?=[\s\d-]|$)/i, "xiaomimimo"],
  [/^mistral(?=[\s\d-]|$)/i, "mistral-color"],
  [/^llama(?=[\s\d-]|$)/i, "meta-color"],
];

function badge(slug: string | undefined, name: string): HTMLElement {
  return h("span", { class: `model-icon${slug ? "" : " model-icon--fallback"}`, "aria-hidden": "true" }, slug
    ? h("img", { src: `${import.meta.env.BASE_URL}model-icons/${slug}.svg`, alt: "", width: "22", height: "22", loading: "lazy", decoding: "async" })
    : name.trim().slice(0, 2).toLocaleUpperCase() || "?");
}

/** Never substitute a model brand for an unknown seller platform. */
export function vendorBadge(platformId: string | null, name: string): HTMLElement {
  return badge(PROVIDERS.get(platformId ?? ""), name);
}

/** Family names must match from the start, so base models mentioned in parentheses do not trigger a match. */
export function modelBadge(name: string): HTMLElement {
  return badge(FAMILIES.find(([pattern]) => pattern.test(name.trim()))?.[1], name);
}
