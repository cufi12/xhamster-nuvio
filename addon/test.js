const assert = require("node:assert/strict");
const scraper = require("./scraper");

(async () => {
  const savedToken = process.env.APIFY_TOKEN;
  delete process.env.APIFY_TOKEN;
  assert.deepEqual(await scraper.catalog({ type: "movie", id: "xh_search" }), { metas: [], cacheMaxAge: 300 });
  assert.deepEqual(await scraper.catalog({ type: "movie", id: "xh_latest" }), { metas: [], cacheMaxAge: 300 });
  for (const id of ["xh_category", "xh_tag", "xh_creator", "xh_channel"]) {
    assert.deepEqual(await scraper.catalog({ type: "movie", id }), { metas: [], cacheMaxAge: 120 });
  }
  assert.deepEqual(await scraper.streams("legacy:x"), { streams: [] });
  assert.deepEqual(await scraper.metadata("legacy:x"), { meta: null });

  const item = {
    title: "Example",
    url: "https://xhamster.com/videos/example#player",
    thumbnail: "https://cdn.example/image.jpg",
    tags: ["tag-a", "tag-b"],
    duration: 120,
    directUrl: "https://cdn.example/video.mp4",
    trailerUrl: "https://cdn.example/preview.mp4"
  };
  const normalized = scraper.normalize(item);
  assert.equal(normalized.title, "Example");
  assert.equal(normalized.pageUrl, "https://xhamster.com/videos/example");
  assert.deepEqual(normalized.tags, ["tag-a", "tag-b"]);
  assert.deepEqual(normalized.previewCandidates, ["https://cdn.example/preview.mp4"]);

  const stableId = scraper.encodeId(item);
  assert.equal(stableId, scraper.encodeId({ ...item, title: "Changed title", description: "new metadata" }));
  assert.equal(scraper.decodeId(stableId).pageUrl, "https://xhamster.com/videos/example");
  assert.equal(scraper.decodeId("xh:not-valid"), null);
  assert.equal(scraper.encodeId({ title: "missing page URL" }), "");

  assert.deepEqual(scraper.directMediaCandidates({ directUrl: "https://cdn.example/video.mp4" }), ["https://cdn.example/video.mp4"]);
  assert.deepEqual(scraper.directMediaCandidates({ directUrl: "javascript:alert(1)" }), []);
  assert.deepEqual(scraper.normalize({ previewUrl: "javascript:alert(1)" }).previewCandidates, []);

  const input = scraper.actorInput({ search: "cats", sort: "newest", tag: "fun" });
  assert.equal(input.searchQuery, "cats");
  assert.equal(input.sort, "newest");
  assert.equal(input.tag, "fun");

  const originalFetch = global.fetch;
  try {
    global.fetch = async (url, options) => ({
      ok: true, status: 200, url: String(url),
      headers: { get: name => name.toLowerCase() === "content-type" ? "video/mp4" : null },
      body: { cancel: async () => {} }
    });
    assert.equal(await scraper.verifyMediaUrl("https://cdn.example/video.mp4"), "https://cdn.example/video.mp4");

    global.fetch = async () => ({
      ok: true, status: 200, url: "https://cdn.example/page",
      headers: { get: name => name.toLowerCase() === "content-type" ? "text/html" : null },
      body: { cancel: async () => {} }
    });
    assert.equal(await scraper.verifyMediaUrl("https://cdn.example/page"), null);
  } finally {
    global.fetch = originalFetch;
    if (savedToken !== undefined) process.env.APIFY_TOKEN = savedToken;
  }


  const tps = require("./tubepornstars");
  assert.equal(tps.MIN_SECONDS, 5400);
  assert.equal(tps.durationSeconds("1:30:00"), 5400);
  assert.equal(tps.durationSeconds("1:29:59"), 5399);
  const tpsCards = tps.parseCards(`
    <div class="card sub group" data-public-id="movie90">
      <a class="item-title item-link" title="German Dub Feature (1995)"></a>
      <span class="badge">1:30:00</span>
      <img src="https://cdn.example/poster.jpg">
    </div>
    <div class="card sub group" data-public-id="short">
      <a class="item-title item-link" title="German Dub Short"></a>
      <span class="badge">1:29:59</span>
    </div>
    <div class="card sub group" data-public-id="clip">
      <a class="item-title item-link" title="German Dub Trailer"></a>
      <span class="badge">2:00:00</span>
    </div>`);
  assert.equal(tpsCards.length, 1);
  assert.equal(tpsCards[0].publicId, "movie90");
\n  console.log("xHamster and TubePornstars catalog contract tests passed.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
