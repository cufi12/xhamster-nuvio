const assert = require("node:assert/strict");
const scraper = require("./scraper");

const page = "https://ge.xhamster.com/videos/sample-123";
const html = {
  "https://ge.xhamster.com/search/sample": '<a href="/videos/sample-123">Sample Clip</a>',
  [page]: '<meta property="og:title" content="Sample Clip"><meta property="og:image" content="https://cdn.example.test/poster.jpg"><meta property="og:description" content="Test description"><script id="initials-script">{"xplayerSettings":{"sources":{"hls":{"h264":[{"url":"https://cdn.example.test/video.m3u8"}]}}}}</script><script>{"contentUrl":"https://cdn.example.test/video.m3u8"}</script>'
};
global.fetch = async url => ({
  ok: Boolean(html[String(url)]),
  text: async () => html[String(url)] || ""
});

(async () => {
  const result = await scraper.catalog({ type: "movie", id: "xh_search", extra: { search: "sample" } });
  assert.equal(result.metas.length, 1);
  assert.equal(result.metas[0].name, "Sample Clip");
  assert.equal(result.metas[0].poster, "https://cdn.example.test/poster.jpg");
  assert.equal(scraper.urlFromId(result.metas[0].id), page);

  const detail = await scraper.metadata(result.metas[0].id);
  assert.equal(detail.meta.name, "Sample Clip");

  const streamResult = await scraper.streams(result.metas[0].id);
  assert.equal(streamResult.streams.length, 1);
  assert.equal(streamResult.streams[0].url, "https://cdn.example.test/video.m3u8");

  assert.deepEqual(await scraper.streams("not-an-xh-id"), { streams: [] });
  console.log("Catalog search, metadata, ID validation and HLS extraction tests passed.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
