// Site build: root public assets and data JSON are emitted into dist; no second copy of the data is kept.
import { defineConfig } from "vite";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { MARKET_LIST, llmsFull, renderPage, sitemap } from "./seo";
import { PATH } from "./src/copy";

const ICON_DIR = new URL("./public/model-icons/", import.meta.url);
const ICON_FILES = readdirSync(ICON_DIR).filter((name) => /\.svg$/.test(name) || ["README.md", "LICENSE"].includes(name));

let template = "";

const DATA_FILES = ["plans.json", "api-prices.json", "rankings.json", "markets.json", "usd.json", "platforms.json", "price-history.json", "source-checks.json"];

export default defineConfig({
  base: "/",
  publicDir: new URL("../public/", import.meta.url).pathname,
  plugins: [{
    // Fill crawlable head tags and static content; market pages, sitemap and llms-full.txt are written next to index.html.
    name: "prerender",
    transformIndexHtml: { order: "post", handler(html) { template = html; return renderPage(html, "US"); } },
    writeBundle(options) {
      const out = options.dir!;
      for (const m of MARKET_LIST.filter((x) => x !== "US")) {
        mkdirSync(`${out}${PATH[m]}`, { recursive: true });
        writeFileSync(`${out}${PATH[m]}index.html`, renderPage(template, m));
      }
      writeFileSync(`${out}/sitemap.xml`, sitemap());
      writeFileSync(`${out}/llms-full.txt`, llmsFull());
    },
    configureServer(server) {
      server.middlewares.use("/llms-full.txt", (_req, res) => { res.setHeader("Content-Type", "text/plain; charset=utf-8"); res.end(llmsFull()); });
    },
  }, {
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
