const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const scraper = require("./scraper");

const manifest = {
  id: "community.cvn.xhamster.catalog",
  version: "0.1.9",
  name: "CVN xHamster Katalog",
  description: "Community-Katalog mit öffentlicher xHamster-Suche und Videodetails.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["xh:", "ep:", "ae:"],
  catalogs: [
    { type: "movie", id: "xh_german_studio", name: "Deutsche Filme", showInHome: true, pageSize: 40 },
    { type: "movie", id: "xh_german_all", name: "German Dub", showInHome: true, pageSize: 40 },
    { type: "movie", id: "xh_hentai_german_dub", name: "Hentai Dub", showInHome: true, pageSize: 40 },
    { type: "movie", id: "xh_mario_salieri_german_dub", name: "Salieri German Dub", showInHome: true, pageSize: 40 },
    { type: "movie", id: "xh_free_german_platforms", name: "Kostenlos Deutsch – Plattformmix", showInHome: true, pageSize: 40 }
  ],
  behaviorHints: { adult: true, configurable: false }
};

const builder = new addonBuilder(manifest);
builder.defineCatalogHandler(args => {
  if (args.type !== "movie" || !manifest.catalogs.some(catalog => catalog.id === args.id)) {
    return Promise.resolve({ metas: [] });
  }
  return scraper.catalog(args).catch(error => {
    console.error("[CVN catalog] request failed:", error?.stack || error);
    return { metas: [], cacheMaxAge: 60 };
  });
});
builder.defineMetaHandler(args => scraper.metadata(args.id).catch(error => {
  console.error("[CVN metadata] request failed:", error?.stack || error);
  return { meta: { id: String(args.id || ""), type: "movie", name: "Video vorübergehend nicht verfügbar" } };
}));
builder.defineStreamHandler(async args => {
  const id = String(args.id || "");
  const provider = id.startsWith("xh:") ? "xHamster" : id.startsWith("ep:") ? "Eporner" : id.startsWith("ae:") ? "AdultEmbed" : "unknown";
  console.info("[CVN stream] request", provider);
  try {
    const result = await scraper.streams(id);
    const count = Array.isArray(result?.streams) ? result.streams.length : 0;
    console.info("[CVN stream] result", provider, count);
    return result;
  } catch (error) {
    console.error("[CVN streams] request failed:", provider, error?.stack || error);
    return { streams: [] };
  }
});

const port = Number(process.env.PORT || 7000);
serveHTTP(builder.getInterface(), { port });
console.log("CVN xHamster catalog listening on port " + port);
