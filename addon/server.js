const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const scraper = require("./scraper");

const manifest = {
  id: "community.cvn.xhamster.catalog",
  version: "0.1.0",
  name: "CVN xHamster Katalog",
  description: "Community-Katalog mit öffentlicher xHamster-Suche und Videodetails.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["xh:"],
  catalogs: [
    { type: "movie", id: "xh_german_studio", name: "Deutsch – Studio-Produktionen" },
    { type: "movie", id: "xh_german_dub", name: "Deutsch – German Dub" },
    { type: "movie", id: "xh_mario_salieri_german_dub", name: "Mario Salieri – German Dub" },
    { type: "movie", id: "xh_german_new", name: "Deutsch – Neue Videos" },
    { type: "movie", id: "xh_german_popular", name: "Deutsch – Beliebt" },
    { type: "movie", id: "xh_latest", name: "xHamster – Neu" },
    { type: "movie", id: "xh_search", name: "xHamster – Suche", extra: [{ name: "search", isRequired: true }] }
  ],
  behaviorHints: { adult: true, configurable: false }
};

const builder = new addonBuilder(manifest);
builder.defineCatalogHandler(args => {
  if (args.type !== "movie" || !manifest.catalogs.some(catalog => catalog.id === args.id)) return Promise.resolve({ metas: [] });
  return scraper.catalog(args);
});
builder.defineMetaHandler(args => scraper.metadata(args.id));
builder.defineStreamHandler(args => scraper.streams(args.id));

const port = Number(process.env.PORT || 7000);
serveHTTP(builder.getInterface(), { port });
console.log("CVN xHamster catalog listening on port " + port);
