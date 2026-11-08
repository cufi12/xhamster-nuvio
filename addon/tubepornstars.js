// Metadata-only TubePornstars German-dub feature-film catalog.
// Does not resolve outbound redirects or expose unverified playback streams.
const BASE = "https://www.tubepornstars.com";
const SEARCH_URL = BASE + "/search/a/german%20dub?filter%5Bduration%5D=60";
const MIN_SECONDS = 90 * 60;
const cache = new Map();

function decodeHtml(value = "") {
  return String(value).replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}
function durationSeconds(value = "") {
  const m = String(value).match(/(?:^|\s)(\d{1,3}):(\d{2}):(\d{2})(?:\s|$)/);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
}
function safeUrl(value) {
  try {
    const u = new URL(value, BASE);
    return u.protocol === "https:" && u.hostname === "www.tubepornstars.com" ? u.toString() : "";
  } catch { return ""; }
}
function parseCards(html) {
  const cards = String(html).match(/<div class="card\s+sub\b[\s\S]*?(?=<div class="card\s+sub\b|$)/gi) || [];
  const out = [];
  for (const card of cards) {
    const publicId = (card.match(/data-public-id="([^"]+)"/i) || [])[1] || "";
    const title = decodeHtml((card.match(/class="item-title[^"]*"[^>]*title="([^"]+)"/i) || [])[1] || "");
    const img = decodeHtml((card.match(/<img[^>]+src="([^"]+)"/i) || [])[1] || "");
    const durationMatch = card.match(/(?:>|\s)(\d{1,3}:\d{2}:\d{2})(?:\s|<)/);
    const seconds = durationSeconds(durationMatch?.[1] || "");
    if (!publicId || !title || seconds < MIN_SECONDS) continue;
    if (!/\bgerman\s*dub(?:bed)?\b|\bgerman\s*dub\b/i.test(title)) continue;
    if (/\b(clip|trailer|teaser|preview|scene|excerpt)\b/i.test(title)) continue;
    const poster = /^https:\/\//i.test(img) ? img : "";
    out.push({ publicId, title, seconds, poster });
  }
  return out;
}
async function load() {
  const response = await fetch(SEARCH_URL, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; NuvioCatalog/1.0)", accept: "text/html" },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error("TubePornstars returned HTTP " + response.status);
  const html = await response.text();
  if (/blocked due to legislation|age verification required/i.test(html)) {
    throw new Error("TubePornstars requires regional age verification; catalog fetch unavailable");
  }
  return parseCards(html);
}
async function catalog(args = {}) {
  if (args.type !== "movie" || args.id !== "tps_german_dub_movies") return { metas: [], cacheMaxAge: 300 };
  const items = await load();
  const metas = items.map(item => {
    const id = "tps:" + item.publicId;
    cache.set(id, item);
    return {
      id, type: "movie", name: item.title,
      poster: item.poster || undefined,
      description: "German Dub · Spielfilm · Laufzeit mindestens 90 Minuten. Quelle: TubePornstars.",
      runtime: Math.floor(item.seconds / 60) + " min",
      website: SEARCH_URL
    };
  });
  return { metas, cacheMaxAge: 1800 };
}
async function metadata(id) {
  const item = cache.get(String(id || ""));
  if (!item || !String(id).startsWith("tps:")) return { meta: null };
  return { meta: {
    id, type: "movie", name: item.title, poster: item.poster || undefined,
    description: "German Dub · Spielfilm · Laufzeit mindestens 90 Minuten. Externe Quelle; Wiedergabe nicht verifiziert.",
    runtime: Math.floor(item.seconds / 60) + " min", website: SEARCH_URL
  }};
}
async function streams() { return { streams: [] }; }
module.exports = { catalog, metadata, streams, parseCards, durationSeconds, MIN_SECONDS };
