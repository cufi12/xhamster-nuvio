const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

const expected = [
  { id: "cvn-de-studios", file: "providers/de-classics.js", types: ["movie"] },
  { id: "cvn-german-dub-world", file: "providers/german-dub.js", types: ["movie"] },
  { id: "cvn-hentai-german-dub", file: "providers/hentai-jp.js", types: ["movie", "tv"] },
];

assert.equal(typeof manifest.name, "string");
assert.ok(manifest.name.trim(), "manifest.name must not be empty");
assert.equal(typeof manifest.version, "string");
assert.ok(Array.isArray(manifest.scrapers), "manifest.scrapers must be an array");
assert.equal(manifest.scrapers.length, expected.length, "exactly three categories are required");

const ids = new Set();
(async () => {
  for (const spec of expected) {
    const entry = manifest.scrapers.find((item) => item.id === spec.id);
    assert.ok(entry, "missing scraper " + spec.id);
    assert.ok(!ids.has(entry.id), "duplicate scraper id " + entry.id);
    ids.add(entry.id);

    assert.equal(entry.filename, spec.file, spec.id + " filename mismatch");
    assert.deepEqual(entry.supportedTypes, spec.types, spec.id + " supportedTypes mismatch");
    assert.equal(entry.enabled, false, spec.id + " must stay disabled until sources are verified");
    assert.ok(fs.existsSync(path.join(root, entry.filename)), "missing provider file " + entry.filename);

    const provider = require(path.join(root, entry.filename));
    assert.equal(typeof provider.getStreams, "function", spec.id + " must export getStreams");

    const result = await provider.getStreams("550", "movie", null, null);
    assert.ok(Array.isArray(result), spec.id + " must return an array");
    assert.equal(result.length, 0, spec.id + " must not return unverified streams");
  }

  assert.equal(ids.size, expected.length);
  console.log("PASS: manifest schema, three categories, files, exports and safe empty results.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
