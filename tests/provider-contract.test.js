const assert = require("node:assert/strict");

const providers = [
  ["Deutsche Studios", require("../providers/de-classics.js")],
  ["German Dub", require("../providers/german-dub.js")],
  ["Hentai German Dub", require("../providers/hentai-jp.js")],
];

(async () => {
  for (const [name, provider] of providers) {
    assert.equal(typeof provider.getStreams, "function", name + " must export getStreams");
    const result = await provider.getStreams("550", "movie", null, null);
    assert.ok(Array.isArray(result), name + " must return an array");
    assert.equal(result.length, 0, name + " must not return unverified streams");
  }
  console.log("Provider contract OK (all providers safely return no unverified streams).");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
