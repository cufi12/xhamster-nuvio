const assert = require("node:assert/strict");
const scraper = require("./scraper");
const { createServer, parseRoute, manifest } = require("./server");

(async () => {
  assert.deepEqual(manifest.catalogs.map(c => c.id), ["xh_search"]);
  assert.deepEqual(manifest.idPrefixes, ["xhlink:"]);
  assert.equal(manifest.name, "CVN xHamster Links");
  assert.deepEqual(await scraper.catalog({ type: "movie", id: "xh_search" }), { metas: [], cacheMaxAge: 60 });
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

  const parsedRoute = parseRoute("/catalog/movie/xh_search/search=cats%20%26%20dogs.json", new URLSearchParams());
  assert.deepEqual(parsedRoute, { resource: "catalog", type: "movie", id: "xh_search", extra: { search: "cats & dogs" } });
  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    const manifestResponse = await fetch(base + "/manifest.json");
    assert.equal(manifestResponse.status, 200);
    const httpManifest = await manifestResponse.json();
    assert.equal(httpManifest.id, "community.nuvio.xhamster-links");
    assert.deepEqual(httpManifest.catalogs.map(c => c.id), ["xh_search"]);
    assert.equal(httpManifest.idPrefixes.includes("ixx:"), false);
    const catalogResponse = await fetch(base + "/catalog/movie/xh_search/search=" + encodeURIComponent("cats & dogs") + ".json");
    assert.equal(catalogResponse.status, 200);
    const httpCatalog = await catalogResponse.json();
    assert.equal(httpCatalog.metas.length, 1);
    assert.equal(httpCatalog.metas[0].name, "xHamster-Suche: cats & dogs");
    const metaResponse = await fetch(base + "/meta/movie/" + encodeURIComponent(httpCatalog.metas[0].id) + ".json");
    assert.equal((await metaResponse.json()).meta.website, httpCatalog.metas[0].website);
    const streamResponse = await fetch(base + "/stream/movie/" + encodeURIComponent(httpCatalog.metas[0].id) + ".json");
    assert.equal((await streamResponse.json()).streams[0].externalUrl, httpCatalog.metas[0].website);
    assert.equal((await fetch(base + "/manifest.json", { method: "POST" })).status, 405);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
  console.log("CVN xHamster-only catalog tests passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
