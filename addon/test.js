const assert = require("node:assert/strict");
const scraper = require("./scraper");

(async () => {
  assert.deepEqual(await scraper.catalog({ type: "movie", id: "xh_search" }), { metas: [], cacheMaxAge: 300 });
  assert.deepEqual(await scraper.catalog({ type: "movie", id: "xh_category" }), { metas: [], cacheMaxAge: 120 });
  assert.deepEqual(await scraper.catalog({ type: "movie", id: "xh_tag" }), { metas: [], cacheMaxAge: 120 });
  assert.deepEqual(await scraper.catalog({ type: "movie", id: "xh_creator" }), { metas: [], cacheMaxAge: 120 });
  assert.deepEqual(await scraper.catalog({ type: "movie", id: "xh_channel" }), { metas: [], cacheMaxAge: 120 });
  assert.deepEqual(await scraper.streams("legacy:x"), { streams: [] });
  assert.deepEqual(await scraper.metadata("legacy:x"), { meta: null });

  const normalized = scraper.normalize({
    title: "Example", url: "https://xhamster.com/videos/example",
    thumbnail: "https://cdn.example/image.jpg", tags: ["tag-a", "tag-b"], duration: 120
  });
  assert.equal(normalized.title, "Example");
  assert.equal(normalized.pageUrl, "https://xhamster.com/videos/example");
  assert.deepEqual(normalized.tags, ["tag-a", "tag-b"]);

  assert.deepEqual(scraper.directMediaUrls({
    url: "https://xhamster.com/videos/example",
    directUrl: "https://cdn.example/video.mp4"
  }), ["https://cdn.example/video.mp4"]);
  assert.deepEqual(scraper.directMediaUrls({
    directUrl: "https://xhamster.com/videos/example"
  }), []);

  const input = scraper.actorInput({ search: "cats", sort: "newest", tag: "fun" });
  assert.equal(input.searchQuery, "cats");
  assert.equal(input.sort, "newest");
  assert.equal(input.tag, "fun");

  console.log("xHamster Apify addon contract tests passed.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
