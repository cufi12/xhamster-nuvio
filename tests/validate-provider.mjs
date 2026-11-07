import fs from "node:fs";
import assert from "node:assert/strict";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const provider = fs.readFileSync("providers/xhamster.js", "utf8");

assert.equal(manifest.version, "1.9.3");
assert.equal(manifest.scrapers?.[0]?.version, manifest.version);
assert.equal(manifest.scrapers?.[0]?.filename, "providers/xhamster.js");
assert.equal(manifest.scrapers?.[0]?.hasSettings, true);
assert.ok(provider.includes("getStreams: getStreams"));
assert.ok(provider.includes("onSettings: onSettings"));
assert.ok(provider.includes("globalThis.SCRAPER_SETTINGS"));
assert.ok(!provider.includes("4ef0d7355d9ffb5151e987764708ce96"));
assert.ok(!provider.includes("TMDB_API_KEY"), "No stale TMDB_API_KEY references may remain.");
assert.equal((provider.match(/encodeURIComponent\(apiKey\)/g) || []).length, 2,
  "Both TMDB endpoints must use the configured API key.");
assert.ok(provider.includes('key: "tmdbApiKey"'), "Settings must expose the TMDB key.");
assert.ok(provider.includes('isPassword: true'), "TMDB key input must be masked.");
assert.deepEqual(manifest.scrapers?.[0]?.supportedTypes, ["movie", "other"]);


console.log("Provider manifest and static contract checks passed.");
