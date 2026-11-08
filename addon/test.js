const assert = require("node:assert/strict");
const scraper = require("./scraper");

(async () => {
  assert.deepEqual(await scraper.catalog({ type: "movie", id: "xh_search" }), { metas: [], cacheMaxAge: 60 });
  assert.deepEqual(await scraper.catalog({ type: "movie", id: "xh_latest" }), { metas: [], cacheMaxAge: 300 });
  assert.equal(scraper.queryFrom({ extra: { search: "  cats & dogs  " } }), "cats & dogs");
  assert.equal(scraper.searchUrl("cats & dogs"), "https://xhamster.com/search/cats%20%26%20dogs");
  const result = await scraper.catalog({ type: "movie", id: "xh_search", extra: { search: "cats & dogs" } });
  assert.equal(result.metas.length, 1);
  assert.equal(result.metas[0].name, "xHamster-Suche: cats & dogs");
  assert.equal(result.metas[0].website, "https://xhamster.com/search/cats%20%26%20dogs");
  const id = result.metas[0].id;
  assert.equal(scraper.decodeId(id), result.metas[0].website);
  assert.equal((await scraper.metadata(id)).meta.website, result.metas[0].website);
  const streams = await scraper.streams(id);
  assert.equal(streams.streams.length, 1);
  assert.equal(streams.streams[0].externalUrl, result.metas[0].website);
  assert.deepEqual(await scraper.streams("xhlink:invalid"), { streams: [] });
  assert.deepEqual(await scraper.metadata("legacy:x"), { meta: null });
  assert.equal(scraper.encodeId("https://evil.example/search/test"), "");
  console.log("xHamster external-link catalog tests passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
