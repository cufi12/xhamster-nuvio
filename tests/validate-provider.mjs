import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const entries = manifest.scrapers;

assert.equal(typeof manifest.name, "string");
assert.match(String(manifest.version || ""), /^\d+\.\d+\.\d+$/);
assert.ok(Array.isArray(entries) && entries.length > 0,
  "The repository manifest must contain provider entries.");
assert.equal(new Set(entries.map(entry => entry.id)).size, entries.length,
  "Provider IDs must be unique.");
assert.equal(new Set(entries.map(entry => entry.filename)).size, entries.length,
  "Provider source files must be unique.");

const providerRoot = path.resolve(root, "providers") + path.sep;
for (const entry of entries) {
  assert.ok(entry && typeof entry.id === "string" && entry.id.trim());
  assert.ok(typeof entry.name === "string" && entry.name.trim());
  assert.ok(typeof entry.version === "string" && entry.version.trim());
  assert.ok(typeof entry.filename === "string" && entry.filename.trim());
  assert.equal(typeof entry.enabled, "boolean",
    `${entry.id} must explicitly declare whether it is enabled.`);
  assert.ok(Array.isArray(entry.supportedTypes) && entry.supportedTypes.length > 0,
    `${entry.id} must declare supported media types.`);
  assert.ok(entry.supportedTypes.every(type => ["movie", "tv"].includes(type)),
    `${entry.id} declares an unsupported media type.`);

  const resolved = path.resolve(root, entry.filename);
  assert.ok(resolved.startsWith(providerRoot),
    `${entry.id} must reference a file inside providers/.`);
  assert.ok(fs.existsSync(resolved), `Provider source is missing: ${entry.filename}`);

  const provider = require(resolved);
  assert.equal(typeof provider.getStreams, "function",
    `${entry.id} must export getStreams().`);
}

const active = entries.filter(entry => entry.enabled);
assert.ok(active.length > 0, "At least one repository provider must be enabled.");
assert.ok(active.some(entry => entry.id === "cvn-open-culture-archive"),
  "The currently verified Open Culture Archive provider must remain enabled.");

for (const id of ["cvn-de-studios", "cvn-german-dub-world", "cvn-hentai-german-dub"]) {
  const entry = entries.find(candidate => candidate.id === id);
  if (entry) {
    assert.equal(entry.enabled, false,
      `${id} must stay disabled until its source, actual audio language and playback are verified.`);
  }
}

assert.ok(!entries.some(entry => /ixxx|ixx/i.test([entry.id, entry.filename].join(" "))),
  "An unverified iXXX provider must not be registered.");
assert.ok(!entries.some(entry => entry.id === "xhamster" && entry.enabled),
  "The legacy xHamster stream provider must not be enabled while the separate addon is link-only.");

const addonServer = require("../addon/server.js");
const addonScraper = require("../addon/scraper.js");
assert.equal(addonServer.manifest.id, "community.nuvio.xhamster-links");
assert.ok(addonServer.manifest.description.includes("Keine direkten Medienstreams"));
assert.deepEqual(addonServer.manifest.catalogs.map(catalog => catalog.id), ["xh_search"]);

const search = await addonScraper.catalog({
  type: "movie",
  id: "xh_search",
  extra: { search: "contract test" }
});
assert.equal(search.metas.length, 1);
const streamResult = await addonScraper.streams(search.metas[0].id);
assert.equal(streamResult.streams.length, 1);
assert.equal(streamResult.streams[0].externalUrl, search.metas[0].website);
assert.equal(streamResult.streams[0].url, undefined,
  "The current xHamster addon must expose an external link, not claim to provide a media stream.");

console.log("Manifest/provider contract checks passed for the current plugin + link-addon architecture.");
