const assert = require("node:assert/strict");
const scraper = require("./scraper");

const page = "https://ge.xhamster.com/videos/sample-123";
const pageHtml = '<meta property="og:title" content="Hentai German Dub Sample"><meta property="og:image" content="https://cdn.example.test/poster.jpg"><meta property="og:description" content="German dubbed sample"><script id="initials-script">{"xplayerSettings":{"sources":{"hls":{"h264":[{"url":"https://cdn.example.test/video.m3u8"}]}}}}</script>';
const html = new Map([
  ["https://ge.xhamster.com/search/sample", '<a href="/videos/sample-123">Sample Clip</a>'],
  ["https://ge.xhamster.com/search/German%20Dub", '<a href="/videos/sample-123">German Dub Sample</a>'],
  ["https://ge.xhamster.com/search/German", '<a href="/videos/sample-123">German Sample</a>'],
  ["https://ge.xhamster.com/search/Deutsch", '<a href="/videos/sample-123">Deutsch Sample</a>'],
  ["https://ge.xhamster.com/search/Hentai%20German%20Dub", '<a href="/videos/sample-123">Hentai German Dub Sample</a>'],
  [page, pageHtml]
]);
global.fetch = async url => ({
  ok: html.has(String(url)),
  status: html.has(String(url)) ? 200 : 404,
  headers: { get: () => "application/vnd.apple.mpegurl" },
  text: async () => html.get(String(url)) || ""
});

(async () => {
  const result = await scraper.catalog({ type: "movie", id: "custom", extra: { search: "sample" } });
  assert.equal(result.metas.length, 1);
  assert.equal(result.metas[0].name, "Hentai German Dub Sample");
  assert.equal(result.metas[0].poster, "https://cdn.example.test/poster.jpg");

  const germanDub = await scraper.catalog({ type: "movie", id: "xh_german_all" });
  assert.equal(germanDub.metas.length, 1);
  const hentaiDub = await scraper.catalog({ type: "movie", id: "xh_hentai_german_dub" });
  assert.equal(hentaiDub.metas.length, 1);
  const germanStudio = await scraper.catalog({ type: "movie", id: "xh_german_studio" });
  assert.equal(germanStudio.metas.length, 1);
  const widerGermanSearch = await scraper.catalog({ type: "movie", id: "xh_free_german_platforms" });
  assert.equal(widerGermanSearch.metas.length, 1);

  assert.equal(scraper.urlFromId(result.metas[0].id), page);
  const detail = await scraper.metadata(result.metas[0].id);
  assert.equal(detail.meta.name, "Hentai German Dub Sample");
  const streamResult = await scraper.streams(result.metas[0].id);
  assert.equal(streamResult.streams.length, 1);
  assert.equal(streamResult.streams[0].url, "https://cdn.example.test/video.m3u8");
  assert.deepEqual(await scraper.streams("not-an-xh-id"), { streams: [] });
  console.log("Catalog discovery, metadata, ID validation and HLS extraction tests passed.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
