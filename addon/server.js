const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const scraper = require("./scraper");
const ixxx = require("./ixxx");

const manifest = {
  id: "community.nuvio.german-dub-catalog",
  version: "1.4.0",
  name: "German Dub & Studio Katalog",
  description: "iXXX-Verzeichnis für deutsche Synchronfassungen, Anime sowie ausschließlich Magma- und MMV-Filme. Externe Weiterleitungen; direkte Wiedergabe wird nicht zugesichert.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["ixx:", "xh:"],
  catalogs: [
    { type: "movie", id: "ixxx_german_dub_movies", name: "German Dub · Spielfilme (90+ Min.)", extra: [], showInHome: true, pageSize: 40 },
    { type: "movie", id: "ixxx_german_dub_anime", name: "German Dub · Anime", extra: [], showInHome: true, pageSize: 40 },
    { type: "movie", id: "ixxx_magma_movies", name: "Deutsche Studios · Magma (90+ Min.)", extra: [], showInHome: true, pageSize: 40 },
    { type: "movie", id: "ixxx_mmv_movies", name: "Deutsche Studios · MMV (90+ Min.)", extra: [], showInHome: true, pageSize: 40 }
  ],
  behaviorHints: { adult: true, configurable: false }
};

const builder = new addonBuilder(manifest);
builder.defineCatalogHandler(args => ixxx.catalog(args).catch(error => {
  console.error("[iXXX catalog] request failed:", error?.stack || error);
  return { metas: [], cacheMaxAge: 60 };
}));
builder.defineMetaHandler(args => (String(args.id || "").startsWith("ixx:") ? ixxx.metadata(args.id) : scraper.metadata(args.id)).catch(error => {
  console.error("[catalog metadata] request failed:", error?.stack || error);
  return { meta: null };
}));
builder.defineStreamHandler(args => (String(args.id || "").startsWith("ixx:") ? ixxx.streams(args.id) : scraper.streams(args.id)).catch(error => {
  console.error("[catalog streams] request failed:", error?.stack || error);
  return { streams: [] };
}));

const addon = builder.getInterface();
const port = Number(process.env.PORT || 7000);
serveHTTP(addon, { port });
console.log("[Nuvio] German Dub catalog listening on", port);
