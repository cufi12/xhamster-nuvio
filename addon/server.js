const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const scraper = require("./scraper");

const manifest = {
  id: "community.cvn.xhamster.catalog",
  version: "0.1.7",
  name: "CVN xHamster Katalog",
  description: "Community-Katalog mit öffentlicher xHamster-Suche und Videodetails.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["xh:", "ep:", "ae:"],
  catalogs: [
    { type: "movie", id: "xh_german_studio", name: "Deutsche Filme", showInHome: true, pageSize: 40 },
    { type: "movie", id: "xh_german_all", name: "German Dub", showInHome: true, pageSize: 40 },
    { type: "movie", id: "xh_hentai_german_dub", name: "Hentai Dub", showInHome: true, pageSize: 40 },
    { type: "movie", id: "xh_mario_salieri_german_dub", name: "Salieri German Dub", showInHome: true, pageSize: 40 }
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
