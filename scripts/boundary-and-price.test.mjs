import test from "node:test";
import assert from "node:assert/strict";
import { round } from "./currency.mjs";
import { assertPublicData } from "./public-boundary.mjs";

test("USD token prices retain sub-cent precision", () => {
  assert.equal(round(0.001, 6), 0.001);
  assert.equal(round(0.006, 6), 0.006);
  assert.equal(round(19.995), 20);
});
test("public boundary accepts ordinary public model pricing", () => {
  assert.doesNotThrow(() => assertPublicData({ sourceUrl: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing", input:2, cacheHit:0.04, quotaUnit:"tokens", notes:"缓存命中另计" }));
});
test("internal social datasets and credential fields are rejected at any depth", () => {
  for (const value of [
    {sourceUrl:"https://www.xiaohongshu.com/explore/internal"},
    {nested:[{sourceUrl:"https://v.douyin.com/private"}]},
    {nested:{apiKey:"test-only"}},
    {sourceUrl:"https://user:example@public.example/pricing"},
    {sourceUrl:"https://public.example/pricing?access_token=test-only"},
    {notes:"file:///private/internal/file"},
  ]) assert.throws(() => assertPublicData(value));
});
