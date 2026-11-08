import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractMimo, extractCommandCode, extractNewProvider } from './provider-extractors.mjs';
const body = readFileSync(new URL('./fixtures/mimo-token-plan.md', import.meta.url), 'utf8');
const plan = (id, amount, period = 'month') => ({ id, price: { amount, currency: 'USD', period } });
test('MiMo scopes individual USD rates and annual totals separately from CNY and team pricing', () => {
  assert.equal(extractMimo(body, plan('xiaomi-mimo-token-lite', 6)).amount, 6);
  assert.equal(extractMimo(body, plan('xiaomi-mimo-token-standard', 168.96, 'year')).amount, 168.96);
  assert.equal(extractMimo(body, plan('xiaomi-mimo-token-max', 1056, 'year')).amount, 1056);
  assert.equal(extractMimo(body, plan('xiaomi-mimo-token-max', 100)).observationOnly, true);
});
test('MiMo rejects missing, duplicate and unsupported period tables', () => {
  assert.equal(extractMimo('', plan('xiaomi-mimo-token-lite', 6)).status, 'ambiguous');
  assert.equal(extractMimo(body.replace('$6/month', '$6/month USD 7/month'), plan('xiaomi-mimo-token-lite', 6)).status, 'ambiguous');
  assert.equal(extractMimo(body, plan('xiaomi-mimo-token-lite', 6, 'quarter')).status, 'unsupported');
});
test('Command Code matches named base subscription and preserves processing fee context', () => {
  const html = '<h3>Go</h3><p><span>$<!-- -->1</span><span>/month</span>+ processing fee</p><p>$10 in credits</p><h3>GOAT</h3><p>$10/month+ processing fee</p>';
  const result = extractCommandCode(html, plan('command-code-go', 1));
  assert.equal(result.amount, 1);
  assert.match(result.evidence, /processing fee excluded/);
  assert.equal(result.observationOnly, true);
  assert.equal(extractCommandCode(html, plan('command-code-goat', 9)).status, 'changed-price');
});
test('Command Code holds generic variants, duplicate sections and promotions', () => {
  assert.equal(extractCommandCode('<h3>Max</h3><p>$100/month</p>', plan('command-code-max-10x', 100)).status, 'ambiguous');
  assert.equal(extractCommandCode('<h3>Go</h3><p>$1/month</p><h3>Go</h3><p>$1/month</p>', plan('command-code-go', 1)).status, 'ambiguous');
  assert.equal(extractCommandCode('<h3>Go</h3><p>first month $1/month</p>', plan('command-code-go', 1)).status, 'ambiguous');
});
test('GLM paired prices remain held and unrelated hosts are unsupported', () => {
  assert.equal(extractNewProvider('$12.6/month $18', {...plan('zai-glm-coding-lite', 18), sourceUrl:'https://zcode.z.ai/pricing.html'}).status, 'ambiguous');
  assert.equal(extractNewProvider('', {...plan('kimi-code-plus', 19), sourceUrl:'https://www.kimi.com/code'}), null);
});
