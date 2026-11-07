const assert = require("node:assert/strict");
const scraper = require("./scraper");

(async () => {
  const savedToken = process.env.APIFY_TOKEN;
  delete process.env.APIFY_TOKEN;
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

  const id = scraper.encodeId({
    title: "Example",
    url: "https://xhamster.com/videos/example",
    directMediaUrl: "https://cdn.example/video.mp4"
  });
  const playable = await scraper.streams(id);
  assert.equal(playable.streams.length, 1);
  assert.equal(playable.streams[0].url, "https://cdn.example/video.mp4");

  const input = scraper.actorInput({ search: "cats", sort: "newest", tag: "fun" });
  assert.equal(input.searchQuery, "cats");
  assert.equal(input.sort, "newest");
  assert.equal(input.tag, "fun");

  if (savedToken !== undefined) process.env.APIFY_TOKEN = savedToken;
  console.log("xHamster Apify addon contract tests passed.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
