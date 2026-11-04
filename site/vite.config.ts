// Site build: root public assets and data JSON are emitted into dist; no second copy of the data is kept.
import { defineConfig } from "vite";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const ICON_DIR = new URL("./public/model-icons/", import.meta.url);
const ICON_FILES = readdirSync(ICON_DIR).filter((name) => /\.svg$/.test(name) || ["README.md", "LICENSE"].includes(name));

const DATA_FILES = ["plans.json", "api-prices.json", "rankings.json", "markets.json", "usd.json", "platforms.json", "price-history.json"];

export default defineConfig({
  base: "./",
  publicDir: new URL("../public/", import.meta.url).pathname,
  plugins: [{
    name: "bundle-data",
    generateBundle() {
      for (const file of ICON_FILES) {
        this.emitFile({ type: "asset", fileName: `model-icons/${file}`, source: readFileSync(new URL(file, ICON_DIR)) });
      }
      for (const file of DATA_FILES) {
        const path = new URL(`../data/${file}`, import.meta.url);
        if (existsSync(path)) this.emitFile({ type: "asset", fileName: `data/${file}`, source: readFileSync(path) });
      }
    },
    configureServer(server) {
      server.middlewares.use("/model-icons", (req, res, next) => {
        const name = req.url?.split("?")[0]?.replace(/^\//, "");
        if (!name || !ICON_FILES.includes(name)) return next();
        res.setHeader("Content-Type", name.endsWith(".svg") ? "image/svg+xml" : "text/plain; charset=utf-8");
        res.end(readFileSync(new URL(name, ICON_DIR)));
      });
      server.middlewares.use("/data", (req, res, next) => {
        const name = req.url?.split("?")[0]?.replace(/^\//, "");
        if (!name || !DATA_FILES.includes(name)) return next();
        const path = new URL(`../data/${name}`, import.meta.url);
        if (!existsSync(path)) return next();
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(readFileSync(path));
      });
    },
  }],
  build: { outDir: "dist" },
  server: { port: 5183, strictPort: true },
});
