import fs from "node:fs";
import assert from "node:assert/strict";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const providerSource = fs.readFileSync("providers/xhamster.js", "utf8");

assert.equal(manifest.version, "1.9.8");
assert.equal(manifest.scrapers?.[0]?.version, manifest.version);
assert.equal(manifest.scrapers?.[0]?.filename, "providers/xhamster.js");
assert.equal(manifest.scrapers?.[0]?.hasSettings, true);
assert.equal(manifest.scrapers?.[0]?.contentLanguage, undefined,
  "Do not advertise German content until language is verified.");
assert.ok(manifest.scrapers?.[0]?.description.includes("nicht verifiziert"));
assert.ok(providerSource.includes("getStreams: getStreams"));
assert.ok(providerSource.includes("onSettings: onSettings"));
assert.ok(providerSource.includes("globalThis.SCRAPER_SETTINGS"));
assert.ok(!providerSource.includes("4ef0d7355d9ffb5151e987764708ce96"));
assert.ok(!providerSource.includes("TMDB_API_KEY"), "No stale TMDB_API_KEY references may remain.");
assert.equal((providerSource.match(/encodeURIComponent\(apiKey\)/g) || []).length, 2,
  "Both TMDB endpoints must use the configured API key.");
assert.ok(providerSource.includes('key: "tmdbApiKey"'));
assert.ok(providerSource.includes("isPassword: true"));
assert.deepEqual(manifest.scrapers?.[0]?.supportedTypes, ["movie"],
  "NuvioMobile normalizes other to tv, so this provider must advertise movies only.");

console.log("Provider manifest and static contract checks passed.");

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
globalThis.SCRAPER_SETTINGS = { tmdbApiKey: "test-key-only" };

const originalFetch = globalThis.fetch;
const requestedUrls = [];
globalThis.fetch = async (url) => {
  const requested = String(url);
  requestedUrls.push(requested);

  if (requested.startsWith("https://api.themoviedb.org/3/movie/")) {
    return {
      ok: true,
      json: async () => ({
        title: "Test Film",
        original_title: "Test Film",
        release_date: "2020-05-01"
      })
    };
  }

  if (requested.startsWith("https://ge.xhamster.com/search/")) {
    return {
      ok: true,
      text: async () => '<a href="https://ge.xhamster.com/videos/test-film-123">Test Film</a><a href="https://ge.xhamster.com/videos/unrelated-456">Unrelated</a>'
    };
  }

  if (requested === "https://ge.xhamster.com/videos/test-film-123") {
    return {
      ok: true,
      text: async () => '<meta property="og:title" content="Test Film"><script>{"contentUrl":"https://cdn.example.test/video.m3u8"}</script>'
    };
  }

  if (requested === "https://ge.xhamster.com/videos/unrelated-456") {
    return {
      ok: true,
      text: async () => '<meta property="og:title" content="Completely Unrelated"><script>{"contentUrl":"https://cdn.example.test/unrelated.m3u8"}</script>'
    };
  }

  throw new Error("Unexpected test request: " + requested);
};

try {
  const provider = require("../providers/xhamster.js");
  const settingsSchema = provider.onSettings();
  assert.ok(Array.isArray(settingsSchema), "Provider settings must be an array.");
  const apiKeySetting = settingsSchema.find((setting) => setting.key === "tmdbApiKey");
  assert.ok(apiKeySetting, "TMDB API key setting must be exposed.");
  assert.equal(apiKeySetting.type, "text");
  assert.equal(apiKeySetting.isPassword, true, "Provider schema must declare the field as password-style; UI masking depends on the Nuvio app.");
  assert.ok(apiKeySetting.label && apiKeySetting.description);
  assert.ok(!JSON.stringify(settingsSchema).includes("test-key-only"),
    "Settings schema must not expose a configured secret.");

  const streams = await provider.getStreams("12345", "movie");

  assert.equal(streams.length, 1);
  assert.equal(streams[0].title, "Test Film");
  assert.equal(streams[0].url, "https://cdn.example.test/video.m3u8");
  assert.equal(streams[0].quality, "HLS");
  assert.ok(!streams.some((stream) => stream.title === "Completely Unrelated"));
  assert.deepEqual(await provider.getStreams("12345", "tv"), []);
  assert.deepEqual(await provider.getStreams("12345", "other"), []);
  assert.ok(requestedUrls.some((url) => url.includes("api_key=test-key-only")));

  globalThis.SCRAPER_SETTINGS = {};
  const beforeMissingKey = requestedUrls.length;
  assert.deepEqual(await provider.getStreams("12345", "movie"), []);
  assert.equal(requestedUrls.length, beforeMissingKey);

  console.log("Provider mocked runtime checks passed.");
} finally {
  globalThis.fetch = originalFetch;
  delete globalThis.SCRAPER_SETTINGS;
}
