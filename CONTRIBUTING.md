# Contributing

Use official provider or storefront pages for price updates. Record the source URL and the date you checked it. Leave unknown prices blank where the schema permits and preserve the provider's billing period, units and conditions.

- Update published USD subscription prices in `data/plans.json`.
- Update published USD API rates per million tokens in `data/api-prices.json`.
- Record App Store subscription quotes for US, PK, AE and SA (market, billing currency, channel, source, verification date) in `data/markets.json`. Keep web checkout and app-store offers separate.
- Exchange rates and App Store quotes with a `match` label refresh daily through `.github/workflows/sync.yml`; edit them by hand only for new quotes. Keep FX estimates separate from observed local quotes.

Regenerate and check the catalog after changing source data.

```bash
node scripts/derive-usd.mjs
node scripts/render-readme.mjs
pnpm check
pnpm test
```

Model rankings are refreshed separately with `pnpm sync`.
