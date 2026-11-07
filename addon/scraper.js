// CVN free catalog. This module intentionally contains no legacy xHamster,
// Eporner or AdultEmbed adapters. A site is only added as a playable source
// after its public metadata and native media delivery have been independently
// verified. No access controls, DRM, age checks or anti-bot measures are bypassed.

const CATALOGS = new Set(["cvn_de_classics", "cvn_german_dub", "cvn_hentai_jp"]);

async function catalog(args) {
  if (args.type !== "movie" || !CATALOGS.has(String(args.id || ""))) {
    return { metas: [], cacheMaxAge: 300 };
  }
  // Keep the three category endpoints live but return no fabricated titles.
  // Platform discovery and playable adapters are added only after verification.
  return { metas: [], cacheMaxAge: 900 };
}

async function metadata(id) {
  return { meta: { id: String(id || ""), type: "movie", name: "Eintrag nicht verfügbar" } };
}

async function streams() {
  return { streams: [] };
}

module.exports = { catalog, metadata, streams };
