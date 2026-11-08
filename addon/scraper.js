// Link-only xHamster catalog. It does not fetch, scrape, mirror, or proxy xHamster content.
const BASE = "https://xhamster.com";
const PREFIX = "xhlink:";
const cache = new Map();

function queryFrom(args = {}) {
  const extra = args.extra && typeof args.extra === "object" ? args.extra : {};
  return String(extra.search ?? args.search ?? "").trim().slice(0, 160);
}
function searchUrl(query) {
  return BASE + "/search/" + encodeURIComponent(String(query || "").trim());
}
function encodeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.hostname !== "xhamster.com" || !parsed.pathname.startsWith("/search/")) return "";
    return PREFIX + Buffer.from(parsed.toString(), "utf8").toString("base64url");
  } catch { return ""; }
}
function decodeId(id) {
  const value = String(id || "");
  if (!value.startsWith(PREFIX)) return "";
  try {
    const url = new URL(Buffer.from(value.slice(PREFIX.length), "base64url").toString("utf8"));
    return url.protocol === "https:" && url.hostname === "xhamster.com" && url.pathname.startsWith("/search/") ? url.toString() : "";
  } catch { return ""; }
}
async function catalog(args = {}) {
  if (args.type !== "movie" || args.id !== "xh_search") return { metas: [], cacheMaxAge: 300 };
  const query = queryFrom(args);
  if (!query) return { metas: [], cacheMaxAge: 60 };
  const url = searchUrl(query);
  const id = encodeId(url);
  cache.set(id, { query, url });
  return {
    metas: [{
      id, type: "movie", name: "xHamster-Suche: " + query,
      description: "Öffnet die Suchseite direkt bei xHamster. Keine Suchergebnisse oder Videostreams werden von diesem Add-on ausgelesen oder bereitgestellt.",
      website: url
    }],
    cacheMaxAge: 60
  };
}
async function metadata(id) {
  const url = decodeId(id);
  if (!url) return { meta: null };
  const cached = cache.get(String(id));
  const query = cached?.query || decodeURIComponent(url.split("/search/")[1] || "");
  return { meta: {
    id: String(id), type: "movie", name: "xHamster-Suche: " + query,
    description: "Externe Suche. Die Ergebnisse und Wiedergabe werden direkt auf xHamster angezeigt.",
    website: url
  } };
}
async function streams(id) {
  const url = decodeId(id);
  return { streams: url ? [{ name: "Auf xHamster öffnen", title: "Externe Website – keine Wiedergabe in Nuvio", externalUrl: url }] : [] };
}
module.exports = { catalog, metadata, streams, queryFrom, searchUrl, encodeId, decodeId };
