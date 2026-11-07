import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const providerEntries = manifest.scrapers || [];

assert.equal(manifest.version, "2.1.0");
assert.ok(providerEntries.length >= 1, "Repository must expose at least one provider.");
assert.equal(new Set(providerEntries.map((entry) => entry.id)).size, providerEntries.length,
  "Provider IDs must be unique.");
assert.equal(new Set(providerEntries.map((entry) => entry.filename)).size, providerEntries.length,
  "Each provider must have its own source file.");

for (const entry of providerEntries) {
  assert.ok(entry.id && entry.name && entry.version && entry.filename,
    "Every provider needs id, name, version, and filename.");
  assert.ok(fs.existsSync(path.resolve(entry.filename)),
    `Provider source file is missing: ${entry.filename}`);
  assert.deepEqual(entry.supportedTypes, ["movie"],
    "Current providers must explicitly declare the media types they support.");
}

const xhamster = providerEntries.find((entry) => entry.id === "xhamster");
assert.ok(xhamster, "The existing xHamster provider must remain registered.");
assert.equal(xhamster.version, manifest.version);
assert.equal(xhamster.filename, "providers/xhamster.js");
assert.equal(xhamster.hasSettings, true);
assert.equal(xhamster.contentLanguage, undefined,
  "Do not advertise German content until language is verified.");
assert.ok(xhamster.description.includes("nicht verifiziert"));

const providerSource = fs.readFileSync(xhamster.filename, "utf8");
assert.ok(providerSource.includes("getStreams: getStreams"));
assert.ok(providerSource.includes("onSettings: onSettings"));
assert.ok(providerSource.includes("globalThis.SCRAPER_SETTINGS"));
assert.ok(!providerSource.includes("4ef0d7355d9ffb5151e987764708ce96"));
assert.ok(!providerSource.includes("TMDB_API_KEY"), "No stale TMDB_API_KEY references may remain.");
assert.equal((providerSource.match(/encodeURIComponent\(credentials\.apiKey\)/g) || []).length, 1,
  "The shared TMDB request helper must append the configured v3 API key.");

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
  assert.equal(apiKeySetting.isPassword, true);
  assert.ok(apiKeySetting.label && apiKeySetting.description);
  assert.ok(!JSON.stringify(settingsSchema).includes("test-key-only"));

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

  console.log("Multi-provider manifest checks and xHamster mocked runtime checks passed.");
} finally {
  globalThis.fetch = originalFetch;
  delete globalThis.SCRAPER_SETTINGS;
}
