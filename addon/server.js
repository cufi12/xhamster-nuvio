const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const scraper = require("./scraper");

const manifest = {
  id: "community.cvn.free.catalog",
  version: "1.0.0",
  name: "CVN Gratis-Katalog",
  description: "Drei getrennte kostenlose Katalogbereiche: deutsche Studio-Klassiker, German Dub aus Italien/Europa/USA und japanischer Hentai-Originalton.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["cvnfree:"],
  catalogs: [
    { type: "movie", id: "cvn_de_classics", name: "1 · Deutsche Studios & Klassiker", extra: [{ name: "search", isRequired: false }], showInHome: true, pageSize: 40 },
    { type: "movie", id: "cvn_german_dub", name: "2 · German Dub · Italien, Europa & USA", extra: [{ name: "search", isRequired: false }], showInHome: true, pageSize: 40 },
    { type: "movie", id: "cvn_hentai_jp", name: "3 · Hentai · Japanischer Originalton", extra: [{ name: "search", isRequired: false }], showInHome: true, pageSize: 40 }
  ],
  behaviorHints: { adult: true, configurable: false }
};

const builder = new addonBuilder(manifest);
builder.defineCatalogHandler(args => scraper.catalog(args).catch(error => {
  console.error("[CVN catalog] request failed:", error?.stack || error);
  return { metas: [], cacheMaxAge: 60 };
}));
builder.defineMetaHandler(args => scraper.metadata(args.id));
builder.defineStreamHandler(args => scraper.streams(args.id));
const addon = builder.getInterface();
const port = Number(process.env.PORT || 7000);
serveHTTP(addon, { port });
console.log("[CVN] Gratis-Katalog listening on", port);
