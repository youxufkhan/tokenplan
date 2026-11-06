# Deploy AI Plan Pricing

AI Plan Pricing is a static Vite site. It serves its pricing and benchmark snapshots from the same origin.

```bash
pnpm install --frozen-lockfile
pnpm -C site install --frozen-lockfile
pnpm check
pnpm test
pnpm -C site exec tsc --noEmit
pnpm -C site build
```

Serve `site/dist` from a static host. To preview the build locally, run `pnpm -C site preview --port 5183`.

Each market has its own page: `/`, `/pk/`, `/ae/` and `/sa/`. The build (`site/seo.ts`) prerenders each one with its own title, canonical, hreflang links, structured data and static price tables, and writes `sitemap.xml` and `llms-full.txt` from `data/`. The app replaces the static content once it loads. Old `?market=` links still work.

Production runs on Cloudflare Pages at https://aiplanpricing.yousufkhan.uk/. The `ai-plan-pricing` project builds `main` from `youxufkhan/tokenplan`, runs `pnpm verify`, and publishes `site/dist`. Cloudflare manages the custom domain and TLS certificate.

The project uses Node.js 24 and pnpm 12.4.1. Its build command installs root and site dependencies before running verification.

For Google Search Console, submit `https://aiplanpricing.yousufkhan.uk/sitemap.xml`. The sitemap lists the four market pages with `lastmod` set to the latest price check. Filter and comparison parameters keep the canonical URL of their market page. `public/404.html` makes unknown paths return 404, and `public/_headers` sets security headers (the CSP is report-only until GTM tags are confirmed). Crawl rules are in `public/robots.txt`; `public/llms.txt` provides a short site and data index for tools that support it.
