const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const xhamster = require("./scraper");
const ixxx = require("./ixxx");

const manifest = {
  id: "community.nuvio.cvn-catalog",
  version: "1.7.0",
  name: "CVN · Externe Kataloge",
  description: "iXXX-Verzeichniskataloge und xHamster-Suche mit externen Links. Keine direkten Medienstreams.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["xhlink:", "ixx:"],
  catalogs: [
    { type: "movie", id: "xh_search", name: "xHamster Suche", extra: [{ name: "search", isRequired: true }] },
    { type: "movie", id: "ixxx_german_dub_movies", name: "iXXX · German Dub · Spielfilme" },
    { type: "movie", id: "ixxx_german_dub_anime", name: "iXXX · German Dub · Anime" },
    { type: "movie", id: "ixxx_magma_movies", name: "iXXX · Studio Magma · Spielfilme" },
    { type: "movie", id: "ixxx_mmv_movies", name: "iXXX · Studio MMV · Spielfilme" }
  ],
  behaviorHints: { adult: true, configurable: false }
};

const builder = new addonBuilder(manifest);
builder.defineCatalogHandler(args => {
  const provider = String(args.id || "");
  const handler = provider.startsWith("ixxx_") ? ixxx.catalog : xhamster.catalog;
  return handler(args).catch(error => {
    console.error("[CVN catalog] request failed:", error?.stack || error);
    return { metas: [], cacheMaxAge: 60 };
  });
});
builder.defineMetaHandler(args => {
  const id = String(args.id || "");
  const handler = id.startsWith("ixx:") ? ixxx.metadata : xhamster.metadata;
  return handler(id).catch(error => {
    console.error("[CVN metadata] request failed:", error?.stack || error);
    return { meta: null };
  });
});
builder.defineStreamHandler(args => {
  const id = String(args.id || "");
  // iXXX only exposes directory/redirect pages, never verified media URLs.
  const handler = id.startsWith("ixx:") ? ixxx.streams : xhamster.streams;
  return handler(id).catch(error => {
    console.error("[CVN stream] request failed:", error?.stack || error);
    return { streams: [] };
  });
});

const addon = builder.getInterface();
const port = Number(process.env.PORT || 7000);
serveHTTP(addon, { port });
console.log("[Nuvio] CVN external catalog addon listening on", port);
