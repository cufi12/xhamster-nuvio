const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const scraper = require("./scraper");

const manifest = {
  id: "community.nuvio.xhamster.apify",
  version: "1.3.0",
  name: "xHamster Explorer (Apify)",
  description: "xHamster-Kollektion und Suche über den konfigurierten Apify Actor. Wiedergabe wird nur angeboten, wenn ein direkter Medienstream verifiziert vorliegt.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["xh:", "tps:"],
  catalogs: [
    { type: "movie", id: "tps_german_dub_movies", name: "TubePornstars · German Dub Filme (90+ Min.)", extra: [], showInHome: true, pageSize: 40 },\n    { type: "movie", id: "xh_latest", name: "xHamster", extra: [], showInHome: true, pageSize: 40 },
    { type: "movie", id: "xh_search", name: "xHamster · Suche", extra: [{ name: "search", isRequired: false }, { name: "sort", isRequired: false, options: ["relevance", "newest", "best"] }], showInHome: true, pageSize: 40 },
    { type: "movie", id: "xh_category", name: "xHamster · Kategorie", extra: [{ name: "category", isRequired: false }, { name: "sort", isRequired: false, options: ["relevance", "newest", "best"] }], showInHome: false, pageSize: 40 },
    { type: "movie", id: "xh_tag", name: "xHamster · Tag", extra: [{ name: "tag", isRequired: false }, { name: "sort", isRequired: false, options: ["relevance", "newest", "best"] }], showInHome: false, pageSize: 40 },
    { type: "movie", id: "xh_creator", name: "xHamster · Creator", extra: [{ name: "pornstar", isRequired: false }, { name: "sort", isRequired: false, options: ["relevance", "newest", "best"] }], showInHome: false, pageSize: 40 },
    { type: "movie", id: "xh_channel", name: "xHamster · Channel", extra: [{ name: "channel", isRequired: false }, { name: "sort", isRequired: false, options: ["relevance", "newest", "best"] }], showInHome: false, pageSize: 40 },
    { type: "movie", id: "xh_anime_german_dub", name: "Anime · German Dub", extra: [], showInHome: true, pageSize: 40 },
    { type: "movie", id: "xh_films_german_dub", name: "xHamster Filme · German Dub", extra: [], showInHome: true, pageSize: 40 },
    { type: "movie", id: "xh_german_studios", name: "German Studios", extra: [], showInHome: true, pageSize: 40 }
  ],
  behaviorHints: { adult: true, configurable: false }
};

const tubepornstars = require("./tubepornstars");\nconst builder = new addonBuilder(manifest);
builder.defineCatalogHandler(args => (args.id === "tps_german_dub_movies" ? tubepornstars.catalog(args) : scraper.catalog(args)).catch(error => {
  console.error("[xHamster catalog] request failed:", error?.stack || error);
  return { metas: [], cacheMaxAge: 60 };
}));
builder.defineMetaHandler(args => (String(args.id || "").startsWith("tps:") ? tubepornstars.metadata(args.id) : scraper.metadata(args.id)).catch(error => {
  console.error("[xHamster metadata] request failed:", error?.stack || error);
  return { meta: null };
}));
builder.defineStreamHandler(args => (String(args.id || "").startsWith("tps:") ? tubepornstars.streams(args.id) : scraper.streams(args.id)).catch(error => {
  console.error("[xHamster streams] request failed:", error?.stack || error);
  return { streams: [] };
}));

const addon = builder.getInterface();
const port = Number(process.env.PORT || 7000);
serveHTTP(addon, { port });
console.log("[xHamster] Apify catalog listening on", port);
