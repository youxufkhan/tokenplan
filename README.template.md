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

<!-- data:plans:global -->

## Pay-as-you-go API prices

### Global

<!-- data:api:global -->

## Model benchmarks

Snapshot date: <!-- data:meta:snapshotDate -->

<!-- data:rank:overall -->

### Open-weight models

<!-- data:rank:open -->

### Model value (Agentic Index ≥ <!-- data:meta:valueMinIndex -->)

<!-- data:rank:value -->

## Update the data

Update prices and verification dates in the source JSON after checking the linked provider pages. Run `pnpm sync` to refresh the ranking snapshot and regenerate the USD view. After editing source data locally, run the following commands.

```bash
node scripts/derive-usd.mjs
node scripts/render-readme.mjs
pnpm check
pnpm test
```

See [Contributing](CONTRIBUTING.md) for source and verification requirements.
