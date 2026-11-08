const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const scraper = require("./scraper");

const manifest = {
  id: "community.nuvio.xhamster-links",
  version: "1.6.0",
  name: "xHamster Suche (externer Link)",
  description: "Link-basierte xHamster-Suche ohne Apify, Scraping oder Stream-Proxy. Öffnet xHamster extern.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["xhlink:"],
  catalogs: [
    { type: "movie", id: "xh_search", name: "xHamster Suche", extra: [{ name: "search", isRequired: true }] }
  ],
  behaviorHints: { adult: true, configurable: false }
};

const builder = new addonBuilder(manifest);
builder.defineCatalogHandler(args => scraper.catalog(args).catch(error => {
  console.error("[xHamster link catalog] request failed:", error?.stack || error);
  return { metas: [], cacheMaxAge: 60 };
}));
builder.defineMetaHandler(args => scraper.metadata(args.id).catch(error => {
  console.error("[xHamster link metadata] request failed:", error?.stack || error);
  return { meta: null };
}));
builder.defineStreamHandler(args => scraper.streams(args.id).catch(error => {
  console.error("[xHamster external link] request failed:", error?.stack || error);
  return { streams: [] };
}));

const addon = builder.getInterface();
const port = Number(process.env.PORT || 7000);
serveHTTP(addon, { port });
console.log("[Nuvio] xHamster external-search addon listening on", port);
