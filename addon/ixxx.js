// iXXX metadata catalog for German-dub feature films, anime, and two selected studios.
// iXXX aggregates external sources; this adapter never resolves redirect URLs or claims direct playback.
const BASE = "https://www.ixxx.com";
const MIN_FEATURE_SECONDS = 90 * 60;
const SOURCES = {
  ixxx_german_dub_movies: { path: "/search/a/german%20dub", kind: "german-movies" },
  ixxx_german_dub_anime: { path: "/search/german%20dub%20anime", kind: "anime" },
  ixxx_magma_movies: { path: "/search/a/magma", kind: "magma" },
  ixxx_mmv_movies: { path: "/search/a/mmv", kind: "mmv" }
};
const cache = new Map();

function decodeHtml(value = "") {
  return String(value)
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function durationSeconds(value = "") {
  const parts = String(value).trim().split(":").map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2 && parts.every(Number.isFinite)) return parts[0] * 60 + parts[1];
  return 0;
}

function safeIxxxUrl(value) {
  try {
    const url = new URL(decodeHtml(value), BASE);
    return url.protocol === "https:" && url.hostname === "www.ixxx.com" ? url.toString() : "";
  } catch { return ""; }
}

function parseCards(html) {
  const source = String(html || "");
  const cardPattern = /<div class="card sub group[^"]*"[^>]*data-public-id="([^"]+)"([\s\S]*?)(?=<div class="card sub group|$)/gi;
  const items = [];
  let match;
  while ((match = cardPattern.exec(source))) {
    const publicId = match[1];
    const card = match[2];
    const title = decodeHtml((card.match(/<a\b[^>]*class="[^"]*\bitem-title\b[^"]*"[^>]*title="([^"]+)"/i) || [])[1] || "");
    const posterRaw = decodeHtml((card.match(/<img\b[^>]*src="([^"]+)"/i) || [])[1] || "");
    const durationRaw = (card.match(/class="badge[^"]*"[^>]*>\s*([\d:]+)\s*</i) || [])[1] || "";
    const sourceMatch = card.match(/<a\b[^>]*class="[^"]*\bitem-source\b[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const outMatch = card.match(/<a\b[^>]*class="[^"]*\bitem-title\b[^"]*"[^>]*href="([^"]+)"/i) ||
      card.match(/<a\b[^>]*href="([^"]+)"[^>]*class="[^"]*\bitem-link\b/i);
    const outUrl = outMatch ? safeIxxxUrl(outMatch[1]) : "";
    const sourceUrl = sourceMatch ? safeIxxxUrl(sourceMatch[1]) : "";
    const sourceName = sourceMatch ? decodeHtml(sourceMatch[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()) : "";
    const seconds = durationSeconds(durationRaw);
    if (!publicId || !title || !seconds) continue;
    items.push({
      publicId, title, seconds,
      poster: /^https:\/\//i.test(posterRaw) ? posterRaw : "",
      outUrl: outUrl && new URL(outUrl).pathname.startsWith("/out/") ? outUrl : "",
      sourceName, sourceUrl
    });
  }
  return items;
}

function isGermanDub(item) {
  return /\bgerman\s*dub(?:bed)?\b|\bdubbed\s*in\s*german\b|\bdeutsch\s*synchronisiert\b|\bdeutsche\s*tonspur\b/i.test(item.title);
}
function isAnime(item) {
  return /\b(anime|hentai|animation|animated)\b/i.test(item.title);
}
function isExcludedShortForm(item) {
  return /\b(clip|trailer|teaser|preview|scene|scenes|excerpt|compilation|highlights?)\b/i.test(item.title);
}
function matchesStudio(item, studio) {
  if (studio === "magma") return /\bmagma\b/i.test(item.title);
  if (studio === "mmv") return /\bmmv\b/i.test(item.title);
  return false;
}

function filterItems(items, kind) {
  return items.filter(item => {
    if (isExcludedShortForm(item)) return false;
    if (kind === "german-movies") {
      return item.seconds >= MIN_FEATURE_SECONDS && isGermanDub(item) && !isAnime(item);
    }
    if (kind === "anime") {
      return isGermanDub(item) && isAnime(item);
    }
    if (kind === "magma") {
      return item.seconds >= MIN_FEATURE_SECONDS && matchesStudio(item, "magma") && !isAnime(item);
    }
    if (kind === "mmv") {
      return item.seconds >= MIN_FEATURE_SECONDS && matchesStudio(item, "mmv") && !isAnime(item);
    }
    return false;
  });
}

async function load(source) {
  const url = new URL(source.path, BASE);
  // iXXX offers a 60+ minute filter; the stricter 90-minute rule is applied locally.
  if (source.kind !== "anime") url.searchParams.set("filter[duration]", "3600");
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; NuvioCatalog/1.0)",
      accept: "text/html"
    },
    signal: AbortSignal.timeout(25000)
  });
  if (!response.ok) throw new Error("iXXX returned HTTP " + response.status);
  const html = await response.text();
  if (/age verification required|access denied|checking your browser/i.test(html.slice(0, 12000))) {
    throw new Error("iXXX page is not publicly readable from this server");
  }
  return parseCards(html);
}

function encodeId(publicId) {
  return "ixx:" + Buffer.from(String(publicId), "utf8").toString("base64url");
}
function decodeId(id) {
  const value = String(id || "");
  if (!value.startsWith("ixx:")) return "";
  try {
    const publicId = Buffer.from(value.slice(4), "base64url").toString("utf8");
    return /^[A-Za-z0-9_-]{4,80}$/.test(publicId) ? publicId : "";
  } catch { return ""; }
}

async function catalog(args = {}) {
  const source = SOURCES[String(args.id || "")];
  if (args.type !== "movie" || !source) return { metas: [], cacheMaxAge: 300 };
  const items = filterItems(await load(source), source.kind);
  const metas = items.map(item => {
    const id = encodeId(item.publicId);
    cache.set(id, item);
    return {
      id, type: "movie", name: item.title,
      poster: item.poster || undefined,
      description: [
        source.kind === "german-movies" ? "German Dub · Spielfilm · mindestens 90 Minuten" :
          source.kind === "anime" ? "German Dub · Anime" :
          "Deutsches Studio: " + (source.kind === "magma" ? "Magma" : "MMV") + " · mindestens 90 Minuten",
        item.sourceName ? "Externe Quelle: " + item.sourceName : "Quelle: iXXX",
        "Externe Weiterleitung; Nuvio-Wiedergabe nicht verifiziert."
      ].join(" · "),
      runtime: Math.floor(item.seconds / 60) + " min",
      website: item.outUrl || item.sourceUrl || BASE + source.path
    };
  });
  return { metas, cacheMaxAge: 1800 };
}

async function metadata(id) {
  const publicId = decodeId(id);
  const item = cache.get(String(id || ""));
  if (!publicId || !item) return { meta: null };
  return {
    meta: {
      id: String(id), type: "movie", name: item.title,
      poster: item.poster || undefined,
      description: "iXXX-Verzeichnis · Externe Quelle: " + (item.sourceName || "unbekannt") + ". Direkte Wiedergabe nicht verifiziert.",
      runtime: Math.floor(item.seconds / 60) + " min",
      website: item.outUrl || item.sourceUrl || BASE
    }
  };
}

async function streams() {
  // iXXX exposes outbound directory links, not direct media URLs.
  return { streams: [] };
}

module.exports = {
  catalog, metadata, streams, parseCards, durationSeconds, encodeId, decodeId,
  filterItems, isGermanDub, isAnime, MIN_FEATURE_SECONDS, SOURCES
};
