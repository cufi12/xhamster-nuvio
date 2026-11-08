const assert = require("node:assert/strict");
const scraper = require("./scraper");
const ixxx = require("./ixxx");

(async () => {
  // xHamster external-search catalog.
  assert.deepEqual(await scraper.catalog({ type: "movie", id: "xh_search" }), { metas: [], cacheMaxAge: 60 });
  assert.deepEqual(await scraper.catalog({ type: "movie", id: "xh_latest" }), { metas: [], cacheMaxAge: 300 });
  assert.equal(scraper.queryFrom({ extra: { search: "  cats & dogs  " } }), "cats & dogs");
  assert.equal(scraper.searchUrl("cats & dogs"), "https://xhamster.com/search/cats%20%26%20dogs");
  const search = await scraper.catalog({ type: "movie", id: "xh_search", extra: { search: "cats & dogs" } });
  assert.equal(search.metas.length, 1);
  assert.equal(search.metas[0].name, "xHamster-Suche: cats & dogs");
  assert.equal(search.metas[0].website, "https://xhamster.com/search/cats%20%26%20dogs");
  const searchId = search.metas[0].id;
  assert.equal(scraper.decodeId(searchId), search.metas[0].website);
  assert.equal((await scraper.metadata(searchId)).meta.website, search.metas[0].website);
  assert.equal((await scraper.streams(searchId)).streams[0].externalUrl, search.metas[0].website);
  assert.deepEqual(await scraper.streams("xhlink:invalid"), { streams: [] });
  assert.deepEqual(await scraper.metadata("legacy:x"), { meta: null });
  assert.equal(scraper.encodeId("https://evil.example/search/test"), "");

  // iXXX parser and filtering are tested with a local fixture; no external site is fetched.
  assert.equal(ixxx.durationSeconds("01:35:00"), 5700);
  assert.equal(ixxx.durationSeconds("42:10"), 2530);
  const fixture = `
    <div class="card sub group" data-public-id="abcd1234">
      <a class="item-title" title="Example German Dub Feature Film" href="/out/abcd1234">Example</a>
      <img src="https://www.ixxx.com/poster.jpg">
      <span class="badge">01:35:00</span>
      <a class="item-source" href="https://www.ixxx.com/source">Source Name</a>
    </div>
    <div class="card sub group" data-public-id="short123">
      <a class="item-title" title="German Dub Clip" href="/out/short123">Clip</a>
      <span class="badge">00:02:00</span>
    </div>`;
  const parsed = ixxx.parseCards(fixture);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].outUrl, "https://www.ixxx.com/out/abcd1234");
  assert.equal(ixxx.filterItems(parsed, "german-movies").length, 1);
  assert.equal(ixxx.filterItems(parsed, "german-movies")[0].publicId, "abcd1234");
  assert.equal(ixxx.decodeId(ixxx.encodeId("abcd1234")), "abcd1234");
  assert.equal(ixxx.decodeId("ixx:../../bad"), "");

  const originalFetch = global.fetch;
  global.fetch = async () => new Response(fixture, { status: 200, headers: { "content-type": "text/html" } });
  try {
    const catalog = await ixxx.catalog({ type: "movie", id: "ixxx_german_dub_movies" });
    assert.equal(catalog.metas.length, 1);
    assert.equal(catalog.metas[0].name, "Example German Dub Feature Film");
    assert.match(catalog.metas[0].id, /^ixx:/);
    assert.deepEqual(await ixxx.streams(catalog.metas[0].id), { streams: [] });
    assert.deepEqual(await ixxx.metadata("ixx:unknown"), { meta: null });
  } finally {
    global.fetch = originalFetch;
  }

  console.log("CVN catalog tests passed (xHamster links + iXXX parser/catalog).");
})().catch(error => { console.error(error); process.exitCode = 1; });
