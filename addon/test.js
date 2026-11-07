const assert = require("node:assert/strict");
const scraper = require("./scraper");

(async () => {
  for (const id of ["cvn_de_classics", "cvn_german_dub", "cvn_hentai_jp"]) {
    const result = await scraper.catalog({ type: "movie", id });
    assert.deepEqual(result.metas, []);
  }
  for (const id of ["xh_german_studio", "xh_german_all", "xh_hentai_german_dub", "xh_free_german_platforms", "custom"]) {
    const result = await scraper.catalog({ type: "movie", id });
    assert.deepEqual(result.metas, []);
  }
  assert.deepEqual(await scraper.streams("legacy:x"), { streams: [] });
  assert.equal((await scraper.metadata("legacy:x")).meta.type, "movie");
  console.log("New category manifest, legacy-ID rejection and empty-stream safety tests passed.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
