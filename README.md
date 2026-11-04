# Awesome Coding Plan

Compare AI coding subscriptions, pay-as-you-go API prices, and model benchmarks in USD. The catalog covers U.S. and Pakistan storefront offers alongside published USD reference prices, with links to official pricing and purchase pages.

This English adaptation is based on [Awesome Coding Plan by SuperCLI and contributors](https://github.com/supercli-site/awesome-coding-plan). The underlying data and documentation are distributed under [CC BY 4.0](LICENSE). Model benchmarks are credited to [ModelGo](https://modelgo.ai/models/rankings/agent) and [Artificial Analysis](https://artificialanalysis.ai).

## Run locally

Use Node.js 24 or newer and pnpm.

```bash
pnpm install --frozen-lockfile
pnpm -C site install --frozen-lockfile
pnpm -C site dev
```

Open [localhost:5183](http://localhost:5183). Run `pnpm -C site build` to generate the static site in `site/dist`.

## Reading the prices

- Plan tables show prices per billing period. The website also shows monthly equivalents.
- API prices are per million tokens. The site’s blended rate weights uncached input and output 3:1.
- The monthly API estimator uses your input, output and cache-hit share to project spend in the selected market.
- Pakistan estimates use the [recorded State Bank of Pakistan rate](data/markets.json). App Store prices are listed separately from USD reference prices.
- Model value compares Agentic Index points per USD of task cost for models meeting the minimum benchmark score. Variants are listed separately.

## Global subscriptions

| Plan | Provider | Price (USD) | Quota | Models | Multimodal | Buy | Source |
|---|---|---|---|---|---|---|---|
| **Claude Free** | Anthropic | $0.00/mo | Limited usage, resets every 5h and weekly; Claude Code not included | Claude Sonnet 5.5 | ✅ | [Open](https://claude.com/pricing) | [Official](https://claude.com/pricing) |
| **Claude Pro** | Anthropic | $20.00/mo | 1x baseline usage per 5h & weekly; Claude Code included; Fable billed via usage credits | Claude Fable 5.1, Claude Opus 5.5, Claude Sonnet 5.5, Claude Haiku 5.5 | ✅ | [Open](https://claude.com/pricing) | [Official](https://claude.com/pricing) |
| **Claude Max** | Anthropic | $100.00/mo | 5x Pro usage every 5h and every week; Fable up to 50% of weekly limit; $100/mo API credits | Claude Fable 5.1, Claude Opus 5.5, Claude Sonnet 5.5, Claude Haiku 5.5 | ✅ | [Open](https://claude.com/pricing) | [Official](https://claude.com/pricing) |
| **Claude Ultra** | Anthropic | $200.00/mo | No 5-hour limit (verified accounts); 10x Pro weekly usage; $200/mo API credits | Claude Fable 5.1, Claude Opus 5.5, Claude Sonnet 5.5, Claude Haiku 5.5 | ✅ | [Open](https://claude.com/pricing) | [Official](https://claude.com/pricing) |
| **ChatGPT Free (Codex)** | OpenAI | $0.00/mo | Codex quick tasks in desktop app, subject to rollout | GPT-6 Luna | ✅ | [Open](https://chatgpt.com/pricing/) | [Official](https://developers.openai.com/codex/pricing) |
| **ChatGPT Go (Codex)** | OpenAI | $8.00/mo | Lightweight Codex tasks, GPT-6 Luna standard speed in desktop app | GPT-6 Luna | ✅ | [Open](https://chatgpt.com/pricing/) | [Official](https://developers.openai.com/codex/pricing) |
| **ChatGPT Plus (Codex)** | OpenAI | $20.00/mo | Local msgs per 5h (estimates): GPT-6.1 Sol 15-160, Terra 35-285, GPT-6 Luna 350-3000, Astra 5-45; weekly limits may apply; extend with credits | GPT-6.1 Sol, GPT-6.1 Terra, GPT-6 Luna, GPT-6 Astra | ✅ | [Open](https://chatgpt.com/pricing/) | [Official](https://developers.openai.com/codex/pricing) |
| **ChatGPT Pro (Codex)** | OpenAI | $100.00/mo | Tiers at $100/$200/$500; no 5-hour limit currently; Ultrafast mode only on $500 | GPT-6.1 Sol, GPT-6.1 Terra, GPT-6 Luna, GPT-6 Astra | ✅ | [Open](https://chatgpt.com/pricing/) | [Official](https://developers.openai.com/codex/pricing) |
| **ChatGPT Business (Codex)** | OpenAI | $25.00/mo | Same per-5h estimates as Plus (Standard Business); extend with credits | GPT-6.1 Sol, GPT-6 Luna | ✅ | [Open](https://chatgpt.com/business/) | [Official](https://developers.openai.com/codex/pricing) |
| **Google AI Pro** | Google | $19.99/mo | Gemini CLI 1,500 req/day; Jules 100 tasks/24h, 15 concurrent; Antigravity higher rate limits + AI credit pool | Gemini 4 Argon | ✅ | [Open](https://gemini.google/subscriptions/) | [Official](https://gemini.google/subscriptions/) |
| **Google AI Ultra** | Google | $99.99/mo | $99.99 = 5x AI Pro; $199.99 = 20x AI Pro; Gemini CLI 2,000 req/day; Jules 300 tasks/24h, 60 concurrent | Gemini 4 Argon | ✅ | [Open](https://gemini.google/subscriptions/) | [Official](https://gemini.google/subscriptions/) |
| **Gemini CLI / Code Assist Individual (free)** | Google | $0.00 | 1,000 requests/user/day with Google login; API key free tier 250/day | Gemini (Flash/Pro, per quota) | ✅ | [Open](https://geminicli.com) | [Official](https://geminicli.com/docs/resources/quota-and-pricing/) |
| **Antigravity Individual** | Google | $0.00 | Unlimited Tab completions & command requests; basic weekly rate limits | Gemini models | ✅ | [Open](https://antigravity.google/pricing) | [Official](https://antigravity.google/pricing) |
| **Jules (free)** | Google | $0.00 | 15 tasks per rolling 24h, 3 concurrent | Gemini | ✅ | [Open](https://jules.google) | [Official](https://jules.google/docs/usage-limits/) |
| **Copilot Free** | GitHub | $0.00 | 2,000 completions/month; limited chat & agent usage | Claude Haiku 4.5, GPT-5 mini | ✅ | [Open](https://github.com/features/copilot/plans) | [Official](https://github.com/features/copilot/plans) |
| **Copilot Pro** | GitHub | $10.00/mo | $15/mo total GitHub AI Credits (1 credit=$0.01); unlimited completions; Claude Code & Codex agents | Multiple (Claude/GPT/Gemini) | ✅ | [Open](https://github.com/features/copilot/plans) | [Official](https://github.com/features/copilot/plans) |
| **Copilot Pro+** | GitHub | $39.00/mo | $70/mo total AI credits; 4x+ Pro usage; premium models incl. Opus | Claude Opus, Claude Fable 5.1, GPT | ✅ | [Open](https://github.com/features/copilot/plans) | [Official](https://github.com/features/copilot/plans) |
| **Copilot Max** | GitHub | $100.00/mo | $200/mo total AI credits; 2.9x+ Pro+ usage | Claude Opus, Claude Fable 5.1, GPT | ✅ | [Open](https://github.com/features/copilot/plans) | [Official](https://github.com/features/copilot/plans) |
| **Cursor Free** | Cursor | $0.00 | Limited | Grok | ✅ | [Open](https://cursor.com/pricing) | [Official](https://cursor.com/pricing) |
| **Cursor Plus** | Cursor | $8.00/mo | Grok-only models; shared AI usage pool | Grok | ✅ | [Open](https://cursor.com/pricing) | [Official](https://cursor.com/pricing) |
| **Cursor Premium** | Cursor | $30.00/mo | 4x Plus usage | Grok, Multiple | ✅ | [Open](https://cursor.com/pricing) | [Official](https://cursor.com/pricing) |
| **Cursor Super** | Cursor | $100.00/mo | 15x Plus usage | Grok, Multiple | ✅ | [Open](https://cursor.com/pricing) | [Official](https://cursor.com/pricing) |
| **Cursor Ultra** | Cursor | $200.00/mo | 50x Plus usage | Grok, Multiple | ✅ | [Open](https://cursor.com/pricing) | [Official](https://cursor.com/pricing) |
| **Devin Free (ex-Windsurf)** | Cognition (Windsurf/Devin) | $0.00 | Light agent quota; unlimited Tab & inline edits | SWE-2 | ✅ | [Open](https://devin.ai/pricing) | [Official](https://devin.ai/pricing) |
| **Devin Pro (ex-Windsurf)** | Cognition (Windsurf/Devin) | $20.00/mo | Daily+weekly refreshing quota; extra usage at API pricing | SWE-2, OpenAI, Claude, Gemini, SpaceXAI | ✅ | [Open](https://devin.ai/pricing) | [Official](https://devin.ai/pricing) |
| **Devin Max (ex-Windsurf)** | Cognition (Windsurf/Devin) | $200.00/mo | Significantly higher quotas than Pro (no multiplier given) | SWE-2, Frontier models | ✅ | [Open](https://devin.ai/pricing) | [Official](https://devin.ai/pricing) |
| **Kiro Free** | AWS | $0.00 | 50 credits/month | Claude Sonnet 4.5, Open-weight models | ✅ | [Open](https://kiro.dev/pricing/) | [Official](https://kiro.dev/pricing/) |
| **Kiro Pro** | AWS | $20.00/mo | 1,000 credits/month; add-on $0.04/credit | Premium models | ✅ | [Open](https://kiro.dev/pricing/) | [Official](https://kiro.dev/pricing/) |
| **Kiro Pro+** | AWS | $40.00/mo | 2,000 credits/month | Premium models | ✅ | [Open](https://kiro.dev/pricing/) | [Official](https://kiro.dev/pricing/) |
| **Kiro Pro Max** | AWS | $100.00/mo | 5,000 credits/month | Premium models | ✅ | [Open](https://kiro.dev/pricing/) | [Official](https://kiro.dev/pricing/) |
| **Kiro Power** | AWS | $200.00/mo | 10,000 credits/month | Premium models | ✅ | [Open](https://kiro.dev/pricing/) | [Official](https://kiro.dev/pricing/) |
| **Augment Standard** | Augment Code | $20.00/mo | $20/mo usage (LLM+Context Engine+compute) flat for up to 50 seats; top-ups PAYG | Multiple | ✅ | [Open](https://www.augmentcode.com/pricing) | [Official](https://www.augmentcode.com/pricing) |
| **Augment Business** | Augment Code | $100.00/mo | $100/mo usage flat, up to 50 seats | Multiple | ✅ | [Open](https://www.augmentcode.com/pricing) | [Official](https://www.augmentcode.com/pricing) |
| **Factory Droid Pro** | Factory | $20.00/mo | Baseline rolling rate limits | Multiple | ✅ | [Open](https://factory.com/pricing) | [Official](https://factory.com/pricing) |
| **Factory Droid Plus** | Factory | $100.00/mo | ~5x Pro usage; Droid Computers | Multiple | ✅ | [Open](https://factory.com/pricing) | [Official](https://factory.com/pricing) |
| **Factory Droid Max** | Factory | $200.00/mo | ~10x Pro usage | Multiple | ✅ | [Open](https://factory.com/pricing) | [Official](https://factory.com/pricing) |
| **Zed Personal** | Zed | $0.00 | Free editor; unlimited with own API keys / external agents | BYOK | ✅ | [Open](https://zed.dev/pricing) | [Official](https://zed.dev/pricing) |
| **Zed Pro** | Zed | $10.00/mo | Unlimited edit predictions; $5 tokens included, then API list +10% | GPT-6 Luna, Hosted models | ✅ | [Open](https://zed.dev/pricing) | [Official](https://zed.dev/pricing) |
| **Kilo Code Free / Gateway** | Kilo Code | $0.00 | No subscription; BYOK or provider-rate gateway, no markup | BYOK, Free models via Auto Free | ✅ | [Open](https://kilo.ai/pricing) | [Official](https://kilo.ai/pricing) |
| **Kilo Pass** | Kilo Code | $19.00/mo | Starter $19→up to $26.60 credits; Pro $49→$68.60; Expert $199→$278.60 (up to 50% bonus) | 500+ models | ✅ | [Open](https://kilo.ai/pricing) | [Official](https://kilo.ai/pricing) |
| **Qoder Free** | Qoder | $0.00 | Limited user messages; 2-week Pro trial (300 credits) | Basic models | ✅ | [Open](https://qoder.com/pricing) | [Official](https://docs.qoder.com/account/pricing) |
| **Qoder Lite** | Qoder | $10.00/mo | 1,000 credits/month | Curated models | ✅ | [Open](https://qoder.com/pricing) | [Official](https://docs.qoder.com/account/pricing) |
| **Qoder Pro** | Qoder | $20.00/mo | 2,000 credits/month; packs $20/1,500 | Full lineup | ✅ | [Open](https://qoder.com/pricing) | [Official](https://docs.qoder.com/account/pricing) |
| **Qoder Pro+** | Qoder | $60.00/mo | 6,000 credits/month | Full lineup | ✅ | [Open](https://qoder.com/pricing) | [Official](https://docs.qoder.com/account/pricing) |
| **Qoder Ultra** | Qoder | $200.00/mo | 20,000 credits/month | Full lineup | ✅ | [Open](https://qoder.com/pricing) | [Official](https://docs.qoder.com/account/pricing) |
| **Trae Free (intl)** | ByteDance | $0.00 | Limited usage; 5,000 autocompletions/mo; 2 cloud tasks | Auto mode | ✅ | [Open](https://www.trae.ai/pricing) | [Official](https://www.trae.ai/pricing) |
| **Trae Pro (intl)** | ByteDance | $20.00/mo | $20 usage/mo; unlimited autocomplete; 10 concurrent cloud tasks | Auto + all models | ✅ | [Open](https://www.trae.ai/pricing) | [Official](https://www.trae.ai/pricing) |
| **Trae Pro+ (intl)** | ByteDance | $60.00/mo | $60 usage/mo (3x Pro); 15 cloud tasks | Auto + all models | ✅ | [Open](https://www.trae.ai/pricing) | [Official](https://www.trae.ai/pricing) |
| **Trae Ultra (intl)** | ByteDance | $200.00/mo | $200 usage/mo (10x Pro); 20 cloud tasks; model early access | Auto + all models | ✅ | [Open](https://www.trae.ai/pricing) | [Official](https://www.trae.ai/pricing) |
| **Ollama Pro** | Ollama | $20.00/mo | $60 cloud usage credits/month, resets monthly, no rollover | kimi-k3, glm-5.3, deepseek-v4-pro, minimax-m3 | ✅ | [Open](https://ollama.com/pricing) | [Official](https://ollama.com/pricing) |
| **Ollama Max** | Ollama | $100.00/mo | $300 usage credits/month; 10 concurrent requests | kimi-k3, glm-5.3, deepseek-v4-pro | ✅ | [Open](https://ollama.com/pricing) | [Official](https://ollama.com/pricing) |
| **OpenCode Go** | OpenCode | $10.00/mo | Per-model monthly dollar limits (e.g. GLM-5.3 $15, GLM-5.3-Flash $60) | GLM-5.3, Kimi K3, DeepSeek V4, MiniMax M3, Qwen3.8 | ✅ | [Open](https://opencode.ai/go) | [Official](https://opencode.ai/docs/go/) |
| **OpenCode Go Plus** | OpenCode | $40.00/mo | Higher per-model limits than Go (exact values not extracted) | GLM-5.3, Kimi K3, DeepSeek V4 | ✅ | [Open](https://opencode.ai/go) | [Official](https://opencode.ai/docs/go/) |
| **OpenCode Zen free models** | OpenCode | $0.00 | Limited-time free models; otherwise PAYG +4.6%+$0.31 per credit purchase | GLM-5.3-Flash Free, DeepSeek V4.1 Flash Free, Big Pickle | ✅ | [Open](https://opencode.ai/zen) | [Official](https://opencode.ai/docs/zen/) |
| **Fire Pass** | Fireworks AI | —/mo | Pricing and limits could not be verified. | — | ✅ | [Open](https://fireworks.ai/pricing) | [Official](https://fireworks.ai/pricing) |
| **SuperGrok** | xAI | —/mo | Higher limits, priority access, multi-agent (no figures) | Grok | ✅ | [Open](https://grok.com/supergrok) | [Official](https://x.ai/grok) |
| **Grok Build** | xAI | —/mo | Pricing and limits could not be verified. | Grok | ✅ | [Open](https://x.ai/build) | [Official](https://x.ai/grok) |
| **Amp Hobby** | Amp | $0.00 | Pay-as-you-go hosted orbs; unlimited self-hosted; no Amp token fees | BYOK / subscriptions | ✅ | [Open](https://ampcode.com/pricing) | [Official](https://ampcode.com/pricing) |
| **Amp Individual (Megawatt)** | Amp | $20.00/mo | 45,000 orb minutes; tokens from your own ChatGPT/Claude subs or keys | BYOK / subscriptions | ✅ | [Open](https://ampcode.com/pricing) | [Official](https://ampcode.com/pricing) |
| **OpenRouter free models** | OpenRouter | $0.00 | 20 req/min, 50 req/day; 1,000/day after buying ≥$10 credits | :free models | ✅ | [Open](https://openrouter.ai) | [Official](https://openrouter.ai/pricing) |

## Pay-as-you-go API prices

### Global

| Model | Provider | Input / 1M | Output / 1M | Cache hit | Context | Access | Source |
|---|---|---:|---:|---:|---|---|---|
| **deepseek-flash** | DeepSeek | $0.30 | $1.20 | $0.006 | 1M | [Open](https://platform.deepseek.com) | [Official](https://api-docs.deepseek.com/quick_start/pricing) |
| **deepseek-v4-pro** | DeepSeek | $1.32 | $3.96 | $0.044 | 1M | [Open](https://platform.deepseek.com) | [Official](https://api-docs.deepseek.com/quick_start/pricing) |
| **GLM-5.3** | Z.ai | $1.40 | $4.40 | $0.26 | — | [Open](https://z.ai/manage-apikey/apikey-list) | [Official](https://docs.z.ai/guides/overview/pricing) |
| **GLM-5.3-FlashX** | Z.ai | $0.37 | $1.25 | $0.075 | — | [Open](https://z.ai/manage-apikey/apikey-list) | [Official](https://docs.z.ai/guides/overview/pricing) |
| **kimi-k3.1-pro** | Kimi/Moonshot | $2.00 | $10.00 | $0.20 | 1,048,576 | [Open](https://platform.kimi.ai/console) | [Official](https://platform.kimi.ai/docs/pricing/chat) |
| **kimi-k2.7-code** | Kimi/Moonshot | $0.95 | $4.00 | $0.19 | 262,144 | [Open](https://platform.kimi.ai/console) | [Official](https://platform.kimi.ai/docs/pricing/chat) |
| **MiniMax-M3** | MiniMax | $0.30 | $1.20 | $0.06 | — | [Open](https://platform.minimax.io/user-center/payment/balance) | [Official](https://platform.minimax.io/docs/pricing/overview) |
| **MiniMax-M3.1-Flash** | MiniMax | $0.15 | $0.60 | $0.015 | — | [Open](https://platform.minimax.io/user-center/payment/balance) | [Official](https://platform.minimax.io/docs/pricing/overview) |
| **mimo-v2.6-pro** | Xiaomi MiMo | $0.435 | $0.87 | $0.0036 | — | [Open](https://mimo.mi.com) | [Official](https://mimo.mi.com/static/docs/price/pay-as-you-go.md) |
| **mimo-v2.6-flash** | Xiaomi MiMo | $0.14 | $0.28 | $0.0028 | — | [Open](https://mimo.mi.com) | [Official](https://mimo.mi.com/static/docs/price/pay-as-you-go.md) |
| **claude-opus-5-5** | Anthropic | $4.00 | $20.00 | $0.20 | 1M | [Open](https://platform.claude.com/settings/billing) | [Official](https://platform.claude.com/docs/en/about-claude/pricing) |
| **claude-sonnet-5-5** | Anthropic | $2.00 | $10.00 | $0.10 | 1M | [Open](https://platform.claude.com/settings/billing) | [Official](https://platform.claude.com/docs/en/about-claude/pricing) |
| **claude-haiku-5-5** | Anthropic | $0.10 | $0.50 | $0.01 | — | [Open](https://platform.claude.com/settings/billing) | [Official](https://platform.claude.com/docs/en/about-claude/pricing) |
| **gpt-6.1-sol** | OpenAI | $2.00 | $10.00 | $0.10 | — | [Open](https://platform.openai.com/settings/organization/billing) | [Official](https://developers.openai.com/api/docs/pricing) |
| **gpt-6.1-terra** | OpenAI | $1.00 | $5.00 | $0.05 | — | [Open](https://platform.openai.com/settings/organization/billing) | [Official](https://developers.openai.com/api/docs/pricing) |
| **gpt-5.3-codex** | OpenAI | $1.75 | $14.00 | $0.175 | — | [Open](https://platform.openai.com/settings/organization/billing) | [Official](https://developers.openai.com/api/docs/pricing) |
| **gemini-4-argon** | Google | $2.00 | $10.00 | $0.10 | 1M | [Open](https://aistudio.google.com/apikey) | [Official](https://ai.google.dev/gemini-api/docs/pricing) |
| **gemini-3.8-flash** | Google | $0.75 | $3.75 | $0.075 | — | [Open](https://aistudio.google.com/apikey) | [Official](https://ai.google.dev/gemini-api/docs/pricing) |
| **gemini-3.5-flash-lite** | Google | $0.30 | $2.50 | $0.03 | — | [Open](https://aistudio.google.com/apikey) | [Official](https://ai.google.dev/gemini-api/docs/pricing) |
| **grok-4.7** | xAI | $2.00 | $6.00 | $0.50 | 500K | [Open](https://console.x.ai) | [Official](https://docs.x.ai/developers/pricing) |
| **grok-build-0.1** | xAI | $1.00 | $2.00 | $0.20 | 256K | [Open](https://console.x.ai) | [Official](https://docs.x.ai/developers/pricing) |
| **grok-4.3** | xAI | $1.25 | $2.50 | $0.20 | 1M | [Open](https://console.x.ai) | [Official](https://docs.x.ai/developers/pricing) |
| **mistral-large-4** | Mistral | $0.70 | $2.10 | $0.07 | 1M | [Open](https://console.mistral.ai/) | [Official](https://docs.mistral.ai/inference/pricing) |
| **mistral-small-2603** | Mistral | $0.15 | $0.60 | — | 256K | [Open](https://console.mistral.ai/) | [Official](https://docs.mistral.ai/inference/pricing) |
| **muse-wonder-1.0** | Meta | $4.00 | $20.00 | $0.20 | — | [Open](https://dev.meta.ai/) | [Official](https://dev.meta.ai/docs/pricing-rate-limits) |
| **muse-spark-1.3** | Meta | $1.25 | $4.25 | $0.15 | — | [Open](https://dev.meta.ai/) | [Official](https://dev.meta.ai/docs/pricing-rate-limits) |

## Model benchmarks

Snapshot date: 2026-11-04

| # | Model | Provider | Agentic Index | Cost per task | Output TPS | Weights | API rates (input/output, $/1M) |
|---:|---|---|---:|---:|---:|---|---|
| 1 | Claude Fable 5.1 (Max, Default Fallback) | Anthropic | 57.9 | $7.6297 | 69.59 | Closed weights | $10.00 / $50.00 |
| 2 | Claude Fable 5.1 (Xhigh, Default Fallback) | Anthropic | 57.2 | $5.9783 | 61.14 | Closed weights | $10.00 / $50.00 |
| 3 | Claude Opus 5 (Max) | Anthropic | 56.5 | $5.8584 | 51.04 | Closed weights | $5.00 / $25.00 |
| 4 | Qwen3.8 Max (0902) | Alibaba | 56 | $5.4085 | 37.87 | Closed weights | $2.00 / $6.00 |
| 5 | Claude Opus 5 (Xhigh) | Anthropic | 55.6 | $4.8778 | 52.3 | Closed weights | $5.00 / $25.00 |
| 6 | Muse Spark 1.3 (Max) | Meta | 55.5 | $1.3146 | 150.48 | Closed weights | $1.25 / $4.25 |
| 7 | Qwen3.8-Flash-Next | Alibaba | 53.6 | $0.3722 | 54.69 | Open weights | $0.15 / $0.47 |
| 8 | Claude Fable 5.1 (High, Default Fallback) | Anthropic | 53.1 | $3.9125 | 57.16 | Closed weights | $10.00 / $50.00 |
| 9 | GLM-5.3 (Max) | Z AI | 53.1 | $2.0056 | 85.66 | Open weights | $1.40 / $4.40 |
| 10 | Grok 4.6 (High) | SpaceXAI | 53 | $1.4848 | 67.11 | Closed weights | $2.00 / $6.00 |

### Open-weight models

| # | Model | Provider | Agentic Index | Cost per task | Output TPS | Weights | API rates (input/output, $/1M) |
|---:|---|---|---:|---:|---:|---|---|
| 1 | Qwen3.8-Flash-Next | Alibaba | 53.6 | $0.3722 | 54.69 | Open weights | $0.15 / $0.47 |
| 2 | GLM-5.3 (Max) | Z AI | 53.1 | $2.0056 | 85.66 | Open weights | $1.40 / $4.40 |
| 3 | GLM-5.3-Flash | Z AI | 50.9 | $0.2836 | 71.29 | Open weights | $0.15 / $0.50 |
| 4 | Qwen3.8 2.4T A95B | Alibaba | 50.1 | $2.1552 | 39.08 | Open weights | $2.00 / $6.00 |
| 5 | Kimi K3 (Max) | Kimi | 50 | $2.0001 | 50.76 | Open weights | $3.00 / $15.00 |
| 6 | Qwen3.8 27B (Xhigh) | Alibaba | 45.8 | $1.1464 | 41.9 | Open weights | $0.50 / $3.00 |
| 7 | Qwen3.8 27B (Medium) | Alibaba | 44.4 | $1.2709 | 46.93 | Open weights | $0.50 / $3.00 |
| 8 | DeepSeek V4 Pro 0813 (Max) | DeepSeek | 41.3 | $0.674 | 81.48 | Open weights | $1.32 / $3.96 |
| 9 | DeepSeek V4 Flash 0731 (Max) | DeepSeek | 41 | $0.1775 | 133.43 | Open weights | $0.14 / $0.28 |
| 10 | Qwen3.8 27B (Low) | Alibaba | 38.9 | $1.1702 | 44.68 | Open weights | $0.50 / $3.00 |

### Model value (Agentic Index ≥ 40)

| # | Model | Provider | Agentic Index | Cost per task | Output TPS | Weights | API rates (input/output, $/1M) |
|---:|---|---|---:|---:|---:|---|---|
| 1 | GPT-5.6 Luna (Max) | OpenAI | 42.1 | $0.1783 | 106.15 | Closed weights | $0.20 / $1.20 |
| 2 | DeepSeek V4 Flash 0731 (Max) | DeepSeek | 41 | $0.1775 | 133.43 | Open weights | $0.14 / $0.28 |
| 3 | GLM-5.3-Flash | Z AI | 50.9 | $0.2836 | 71.29 | Open weights | $0.15 / $0.50 |
| 4 | Qwen3.8-Flash-Next | Alibaba | 53.6 | $0.3722 | 54.69 | Open weights | $0.15 / $0.47 |
| 5 | Grok 4.6 (Low) | SpaceXAI | 41.2 | $0.3758 | 68.04 | Closed weights | $2.00 / $6.00 |
| 6 | GPT-5.6 Terra (Xhigh) | OpenAI | 41.4 | $0.6318 | 112.07 | Closed weights | $2.00 / $12.00 |
| 7 | DeepSeek V4 Pro 0813 (Max) | DeepSeek | 41.3 | $0.674 | 81.48 | Open weights | $1.32 / $3.96 |
| 8 | GPT-5.6 Sol (High) | OpenAI | 44.2 | $0.808 | 116.54 | Closed weights | $4.00 / $20.00 |
| 9 | Grok 4.5 (High) | SpaceXAI | 41.2 | $0.7603 | 57.56 | Closed weights | $2.00 / $6.00 |
| 10 | Muse Spark 1.2 (Xhigh) | Meta | 43.2 | $0.812 | 238.25 | Closed weights | $1.25 / $4.25 |

## Update the data

Update prices and verification dates in the source JSON after checking the linked provider pages. Run `pnpm sync` to refresh the ranking snapshot and regenerate the USD view. After editing source data locally, run the following commands.

```bash
node scripts/derive-usd.mjs
node scripts/render-readme.mjs
pnpm check
pnpm test
```

See [Contributing](CONTRIBUTING.md) for source and verification requirements.
