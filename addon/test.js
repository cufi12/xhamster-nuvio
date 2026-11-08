const assert = require("node:assert/strict");
const scraper = require("./scraper");
const ixxx = require("./ixxx");

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

  assert.equal(scraper.isPlayableFullEntry({ title: "Full film", duration: 4800 }), true);
  assert.equal(scraper.isPlayableFullEntry({ title: "Full film", duration: 7200 }), true);
  assert.equal(scraper.isPlayableFullEntry({ title: "Full film", duration: 4799 }), false);
  assert.equal(scraper.isPlayableFullEntry({ title: "Full film", duration: 7201 }), false);
  assert.equal(scraper.isPlayableFullEntry({ title: "Trailer", duration: 6000 }), false);
  assert.equal(scraper.matchesGermanDub({ title: "German Dub", description: "German audio" }), true);
  assert.equal(scraper.matchesGermanDub({ title: "German Dub", description: "A great movie" }), false);
  assert.equal(scraper.matchesAnime({ title: "Japanese Anime feature" }), true);
  assert.equal(scraper.matchesGermanStudio({ studio: "Magma" }), true);
  assert.equal(scraper.matchesGermanStudio({ channel: "MMV Films" }), true);
  assert.equal(scraper.matchesGermanStudio({ studio: "Other German Studio" }), false);
\n  assert.equal(normalized.title, "Example");
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

  assert.equal(ixxx.MIN_FEATURE_SECONDS, 5400);
  assert.equal(ixxx.durationSeconds("1:30:00"), 5400);
  assert.equal(ixxx.durationSeconds("1:29:59"), 5399);
  assert.equal(ixxx.durationSeconds("55:59"), 3359);

  const cards = ixxx.parseCards(`
    <div class="card sub group relative" data-public-id="id90">
      <a class="item-link" href="/out/?l=first"><img src="https://c4.ttcache.com/poster.jpg"><span class="badge">1:30:00</span></a>
      <a class="item-title item-link" href="/out/?l=first" title="Angle - Provocation (2004) (German Dubbed)"></a>
      <a class="item-source" href="/source/eporner">Eporner</a>
    </div>
    <div class="card sub group relative" data-public-id="short">
      <a class="item-link" href="/out/?l=short"><span class="badge">1:29:59</span></a>
      <a class="item-title item-link" href="/out/?l=short" title="German Dub short film"></a>
    </div>
    <div class="card sub group relative" data-public-id="clip">
      <a class="item-link" href="/out/?l=clip"><span class="badge">2:00:00</span></a>
      <a class="item-title item-link" href="/out/?l=clip" title="German Dub trailer"></a>
    </div>`);
  assert.equal(cards.length, 3);
  assert.equal(cards[0].publicId, "id90");
  assert.equal(cards[0].seconds, 5400);
  assert.equal(cards[0].sourceName, "Eporner");
  assert.equal(cards[0].outUrl, "https://www.ixxx.com/out/?l=first");

  const germanMovies = ixxx.filterItems(cards, "german-movies");
  assert.equal(germanMovies.length, 1);
  assert.equal(germanMovies[0].publicId, "id90");

  const anime = ixxx.filterItems([
    { publicId: "anime", title: "German Dubbed Hentai Anime Movie", seconds: 3359 }
  ], "anime");
  assert.equal(anime.length, 1);

  const studios = ixxx.filterItems([
    { publicId: "magma", title: "Full Magma Film: Das Spiel 3", seconds: 5600 },
    { publicId: "mmv", title: "MMV Films Feature Movie", seconds: 6000 },
    { publicId: "other", title: "Other Studio Full Movie", seconds: 7000 },
    { publicId: "short-magma", title: "Magma Film Clip", seconds: 6000 }
  ], "magma");
  assert.equal(studios.length, 1);
  assert.equal(studios[0].publicId, "magma");

  const mmv = ixxx.filterItems([
    { publicId: "mmv", title: "MMV Films Feature Movie", seconds: 6000 },
    { publicId: "other", title: "Other Studio Feature Movie", seconds: 7000 }
  ], "mmv");
  assert.equal(mmv.length, 1);
  assert.equal(mmv[0].publicId, "mmv");

  console.log("xHamster legacy and iXXX catalog contract tests passed.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
