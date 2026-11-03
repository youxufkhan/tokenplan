# Deploy TokenPlan

TokenPlan is a static Vite site. It serves its pricing and benchmark snapshots from the same origin.

```bash
pnpm install --frozen-lockfile
pnpm -C site install --frozen-lockfile
pnpm check
pnpm test
pnpm -C site exec tsc --noEmit
pnpm -C site build
```

Serve `site/dist` from a static host. To preview the build locally, run `pnpm -C site preview --port 5183`.

The two markets use the same page with `?market=us` and `?market=pk`.
