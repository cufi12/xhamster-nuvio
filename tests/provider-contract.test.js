const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

const expected = [
  { id: "cvn-xhamster", file: "providers/xhamster.js", types: ["movie"], enabled: true },
  { id: "cvn-de-studios", file: "providers/de-classics.js", types: ["movie"], enabled: false },
  { id: "cvn-german-dub-world", file: "providers/german-dub.js", types: ["movie"], enabled: false },
  { id: "cvn-hentai-german-dub", file: "providers/hentai-jp.js", types: ["movie", "tv"], enabled: false },
];

assert.equal(typeof manifest.name, "string");
assert.ok(manifest.name.trim(), "manifest.name must not be empty");
assert.equal(typeof manifest.version, "string");
assert.ok(Array.isArray(manifest.scrapers), "manifest.scrapers must be an array");
assert.equal(manifest.scrapers.length, expected.length, "exactly four providers are required");

const ids = new Set();
(async () => {
  for (const spec of expected) {
    const entry = manifest.scrapers.find((item) => item.id === spec.id);
    assert.ok(entry, "missing scraper " + spec.id);
    assert.ok(!ids.has(entry.id), "duplicate scraper id " + entry.id);
    ids.add(entry.id);

    assert.equal(entry.filename, spec.file, spec.id + " filename mismatch");
    assert.deepEqual(entry.supportedTypes, spec.types, spec.id + " supportedTypes mismatch");
    assert.equal(entry.enabled, spec.enabled, spec.id + " enabled state mismatch");
    assert.ok(fs.existsSync(path.join(root, entry.filename)), "missing provider file " + entry.filename);

    const provider = require(path.join(root, entry.filename));
    assert.equal(typeof provider.getStreams, "function", spec.id + " must export getStreams");

    if (spec.id === "cvn-xhamster") {
      assert.equal(typeof provider.onSettings, "function", "xHamster provider must export onSettings");
      const settings = await provider.onSettings();
      assert.ok(Array.isArray(settings) && settings.some((item) => item.key === "tmdbApiKey"),
        "xHamster provider must expose its TMDB API key setting");
      const invalid = await provider.getStreams(null, "unknown", null, null);
      assert.deepEqual(invalid, [], "xHamster provider must safely reject invalid input");
      const series = await provider.getStreams("123", "tv", 1, 1);
      assert.deepEqual(series, [], "xHamster provider is movie-only");
    } else {
      const result = await provider.getStreams("550", "movie", null, null);
      assert.ok(Array.isArray(result), spec.id + " must return an array");
      assert.equal(result.length, 0, spec.id + " must not return unverified streams");

      const invalid = await provider.getStreams(null, "unknown", null, null);
      assert.deepEqual(invalid, [], spec.id + " must safely reject invalid input");
      const emptyId = await provider.getStreams("   ", "movie", null, null);
      assert.deepEqual(emptyId, [], spec.id + " must reject an empty TMDB id");

      if (spec.id === "cvn-hentai-german-dub") {
        const series = await provider.getStreams("123", "tv", 1, 1);
        assert.deepEqual(series, [], "Hentai provider must accept the Nuvio tv media type");
        const legacySeries = await provider.getStreams("123", "series", 1, 1);
        assert.deepEqual(legacySeries, [], "Hentai provider must accept the Nuvio series media type");
      }
    }
  }

  assert.equal(ids.size, expected.length);
  console.log("PASS: manifest schema, four providers, files, exports and safe validation.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
