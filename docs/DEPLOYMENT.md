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

The four markets use the same page: `?market=us`, `?market=pk`, `?market=ae` and `?market=sa`.

Production runs on Cloudflare Pages at https://aiplanpricing.yousufkhan.uk/. The `ai-plan-pricing` project builds `main` from `youxufkhan/tokenplan`, runs `pnpm verify`, and publishes `site/dist`. Cloudflare manages the custom domain and TLS certificate.

The project uses Node.js 24 and pnpm 12.4.1. Its build command installs root and site dependencies before running verification.

For Google Search Console, submit `https://aiplanpricing.yousufkhan.uk/sitemap.xml`. The sitemap lists the canonical homepage. Market views and saved comparison parameters use the same canonical URL. Crawl rules are in `public/robots.txt`; `public/llms.txt` provides a short site and data index for tools that support it.
