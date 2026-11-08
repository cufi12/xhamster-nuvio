const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const scraper = require("./scraper");

// Empty until a verified long-film source is supplied. Do not advertise
// catalogs that currently return no entries.
const manifest = {
  id: "community.nuvio.german-dub-catalog",
  version: "1.5.0",
  name: "German Film Katalog",
  description: "Katalog-Grundgerüst. Filmkategorien werden erst nach Prüfung einer funktionierenden Quelle aktiviert.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["xh:"],
  catalogs: [],
  behaviorHints: { adult: true, configurable: false }
};

const builder = new addonBuilder(manifest);
builder.defineCatalogHandler(async () => ({ metas: [], cacheMaxAge: 300 }));
builder.defineMetaHandler(args => scraper.metadata(args.id).catch(error => {
  console.error("[catalog metadata] request failed:", error?.stack || error);
  return { meta: null };
}));
builder.defineStreamHandler(args => scraper.streams(args.id).catch(error => {
  console.error("[catalog streams] request failed:", error?.stack || error);
  return { streams: [] };
}));

const addon = builder.getInterface();
const port = Number(process.env.PORT || 7000);
serveHTTP(addon, { port });
console.log("[Nuvio] German Film catalog listening on", port);
