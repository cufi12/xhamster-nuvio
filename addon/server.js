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
  catalogs: [
    { type: "movie", id: "xh_latest", name: "Neueste xHamster Videos" },
    { type: "movie", id: "xh_search", name: "xHamster Suche", extra: [{ name: "search", isRequired: true }] },
    { type: "movie", id: "xh_category", name: "xHamster Kategorie", extra: [{ name: "category", isRequired: true }] },
    { type: "movie", id: "xh_tag", name: "xHamster Tags", extra: [{ name: "tag", isRequired: true }] },
    { type: "movie", id: "xh_creator", name: "xHamster Creator", extra: [{ name: "pornstar", isRequired: true }] },
    { type: "movie", id: "xh_channel", name: "xHamster Channel", extra: [{ name: "channel", isRequired: true }] },
    { type: "movie", id: "xh_anime_german_dub", name: "Anime – Deutsch synchronisiert" },
    { type: "movie", id: "xh_films_german_dub", name: "Spielfilme – Deutsch synchronisiert (80–120 Min.)" },
    { type: "movie", id: "xh_german_studios", name: "Magma & MMV – Spielfilme (90–120 Min.)" }
  ],
  behaviorHints: { adult: true, configurable: false }
};

const builder = new addonBuilder(manifest);
builder.defineCatalogHandler(args => scraper.catalog(args).catch(error => {
  console.error("[catalog] request failed:", error?.stack || error);
  return { metas: [], cacheMaxAge: 120 };
}));
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
