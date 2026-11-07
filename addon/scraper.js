const BASE = "https://ge.xhamster.com";
const EP_API = "https://www.eporner.com/api/v2/video/search/";
const EP_BASE = "https://www.eporner.com";
const AE_API = "https://adultembed.com/api/v1";
const AE_BASE = "https://adultembed.com";

const META_CACHE = new Map();

const VIDEO_RE = /^https:\/\/(?:[a-z0-9-]+\.)*xhamster\.com\/videos?\//i;

function decode(value) {
  return String(value || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\\u0026/gi, "&").replace(/\\u002f/gi, "/").replace(/\\\//g, "/");
}
function absolute(value) {
  const raw = decode(value).trim();
  if (/^https:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return "https:" + raw;
  if (raw.startsWith("/")) return BASE + raw;
  return "";
}
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function isGermanDub(value) {
  return /german dub(?:bed)?|ger dub|german audio|german voice|deutsch synchronisiert|deutsche synchronisation|deutsch vertont|deutsche tonspur|deutsche synchro/.test(String(value || "").toLowerCase());
}
function textFromHtml(value) {
  return decode(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
}
function videoLinks(html) {
  const links = [];
  const re = /(?:href|data-href)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const url = absolute(m[1]).split(/[?#]/)[0];
    if (VIDEO_RE.test(url)) links.push(url);
  }
  return unique(links);
}

function nextSearchPage(html, currentUrl) {
  const anchors = /<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchors.exec(html)) !== null) {
    const attrs = match[1] + " " + match[3];
    const label = textFromHtml(match[4]).toLowerCase();
    if (!/rel=["']next["']|aria-label=["'][^"']*next|class=["'][^"']*next/i.test(attrs) &&
        !/^(?:next|›|»|→)$/.test(label)) continue;
    try {
      const candidate = new URL(absolute(match[2]) || match[2], currentUrl);
      const current = new URL(currentUrl);
      if (candidate.protocol === "https:" && candidate.hostname.endsWith("xhamster.com") &&
          candidate.pathname.startsWith("/search/") && candidate.href !== current.href) return candidate.href;
    } catch (_) {}
  }
  return "";
}
async function searchVideoLinks(search) {
  let url = BASE + "/search/" + encodeURIComponent(search);
  const visited = new Set();
  const links = [];
  for (let page = 0; page < 5 && url && !visited.has(url); page++) {
    visited.add(url);
    const html = await getHtml(url);
    if (!html) break;
    links.push(...videoLinks(html));
    url = nextSearchPage(html, url);
  }
  return unique(links);
}

function metaTag(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp("<meta[^>]+property=[\"']" + escaped + "[\"'][^>]+content=[\"']([^\"']+)[\"']", "i"),
    new RegExp("<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+property=[\"']" + escaped + "[\"']", "i")
  ];
  for (const re of patterns) { const m = html.match(re); if (m) return decode(m[1]); }
  return "";
}
async function getHtml(url) {
  const response = await fetch(url, {
    headers: { Accept: "text/html,application/xhtml+xml", "Accept-Language": "de,en;q=0.8" },
    redirect: "follow"
  });
  if (!response.ok) return "";
  return response.text();
}
function makeId(url) { return "xh:" + Buffer.from(url).toString("base64url"); }
function urlFromId(id) {
  if (!String(id).startsWith("xh:")) return "";
  try {
    const url = Buffer.from(String(id).slice(3), "base64url").toString("utf8");
    return VIDEO_RE.test(url) ? url : "";
  } catch (_) { return ""; }
}
async function pageMeta(url) {
  const html = await getHtml(url);
  if (!html) return null;
  const name = metaTag(html, "og:title") || textFromHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [,""])[1]);
  if (!name) return null;
  const poster = metaTag(html, "og:image");
  const description = metaTag(html, "og:description");
  return {
    id: makeId(url), type: "movie", name, poster: poster || undefined,
    description: description || undefined, posterShape: "landscape",
    background: poster || undefined, url
  };
}


function packedId(prefix, data) { return prefix + Buffer.from(JSON.stringify(data)).toString("base64url"); }
function unpackedId(id, prefix) {
  const value = String(id || "");
  if (!value.startsWith(prefix)) return null;
  try { const parsed = JSON.parse(Buffer.from(value.slice(prefix.length), "base64url").toString("utf8")); return parsed && typeof parsed === "object" ? parsed : null; }
  catch (_) { return null; }
}
function normalizeImage(value) {
  if (value && typeof value === "object") value = value.url || value.src || value.href;
  const raw = decode(String(value || "")).trim();
  if (/^https:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return "https:" + raw;
  return "";
}
function aeIdFromId(id) {
  const value = String(id || "");
  if (!value.startsWith("ae:")) return "";
  return unpackedId(value, "ae:")?.v || value.slice(3);
}
function aeVideoId(video) { return String(video?.id || "").trim(); }
function aePlayerUrl(video) {
  const candidate = String(video?.embed?.url || video?.embed_url || "").trim();
  if (/^https:\/\/adultembed\.com\/player\/embed\//i.test(candidate)) return candidate;
  const id = aeVideoId(video);
  return id ? AE_BASE + "/player/embed/" + encodeURIComponent(id) + "/" : "";
}
function aeText(video) {
  const tags = Array.isArray(video?.tags) ? video.tags.join(" ") : String(video?.tags || "");
  const performers = Array.isArray(video?.performers) ? video.performers.join(" ") : "";
  return [video?.title, video?.description, tags, performers, video?.studio].filter(Boolean).join(" ");
}
async function adultEmbedSearch(query, page = 1) {
  const params = new URLSearchParams({ query, per_page: "100", page: String(page), sort: "popular", lang: "de" });
  const response = await fetch(AE_API + "/search?" + params.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data.results) ? data.results : [];
}
async function adultEmbedCatalog(catalogId, skip) {
  const queries = {
    xh_german_studio: ["German Dub", "Deutsch synchronisiert"],
    xh_german_all: ["German Dub", "German dubbed", "Deutsch synchronisiert"],
    xh_hentai_german_dub: ["Hentai German Dub", "Hentai Deutsch synchronisiert"],
    xh_mario_salieri_german_dub: ["Mario Salieri German Dub", "Mario Salieri Deutsch"],
    // Broad free-platform mix; keep only explicit dubbing markers below.
    xh_free_german_platforms: ["German Dub", "German dubbed", "German audio", "Deutsch synchronisiert", "Deutsche Tonspur", "Deutsch vertont"]
  }[catalogId] || [];
  const batches = await Promise.all(queries.map(q => adultEmbedSearch(q, 1)));
  const seen = new Set();
  const videos = [];
  for (const batch of batches) {
    for (const video of batch) {
      const id = aeVideoId(video);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const searchable = aeText(video).toLowerCase();
      // Only keep results whose public title/tags/description explicitly indicate German audio dubbing.
      // lang=de translates metadata only; it is never treated as proof of German audio.
      const germanDub = /german dub(?:bed)?|ger dub|german audio|german voice|deutsch synchronisiert|deutsche synchronisation|deutsch vertont|deutsche tonspur|deutsche synchro/.test(searchable);
      const hentai = /hentai|anime|animated/.test(searchable);
      const salieri = /mario salieri|salieri/.test(searchable);
      if (["xh_german_studio", "xh_german_all"].includes(catalogId) && !germanDub) continue;
      if (catalogId === "xh_hentai_german_dub" && !(germanDub && hentai)) continue;
      if (catalogId === "xh_mario_salieri_german_dub" && !(germanDub && salieri)) continue;
      videos.push(video);
    }
  }
  return videos.slice(skip, skip + 40).map(video => {
    const id = aeVideoId(video);
    const translation = video.translation || {};
    const poster = normalizeImage(video.thumbnail || video.thumb || video.image || video.poster);
    const meta = { type: "movie", name: String(translation.title || video.title || "AdultEmbed Video"),
      poster: poster || undefined, background: poster || undefined, posterShape: "landscape",
      description: String(translation.description || video.description || ""), url: aePlayerUrl(video) || undefined };
    return { ...meta, id: packedId("ae:", { v: id, ...meta }) };
  });
}
async function adultEmbedMetadata(id) {
  const videoId = aeIdFromId(id);
  if (!videoId) return null;
  const response = await fetch(AE_API + "/videos/" + encodeURIComponent(videoId) + "?lang=de", { headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const data = await response.json();
  const video = data.video || data;
  if (!video || !aeVideoId(video)) return null;
  const translation = video.translation || {};
  const poster = normalizeImage(video.thumbnail || video.thumb || video.image || video.poster);
  const meta = { type: "movie", name: String(translation.title || video.title || "AdultEmbed Video"),
    poster: poster || undefined, background: poster || undefined, posterShape: "landscape",
    description: String(translation.description || video.description || ""),
    url: aePlayerUrl(video) || (AE_BASE + "/player/embed/" + encodeURIComponent(videoId) + "/") };
  return { ...meta, id: packedId("ae:", { v: videoId, ...meta }) };
}
async function adultEmbedStreams(id) {
  const videoId = aeIdFromId(id);
  if (!videoId) return [];
  // AdultEmbed currently exposes only an iframe page, not a verified direct
  // media URL. Do not redirect Nuvio to the provider's website; return no
  // stream until a native-player-compatible media source is available.
  return [];
}

function epIdFromId(id) {
  const value = String(id || "");
  if (!value.startsWith("ep:")) return "";
  return unpackedId(value, "ep:")?.v || value.slice(3);
}
function epVideoId(video) {
  return String(video?.id || video?.video_id || "").trim();
}
function epVideoUrl(video) {
  const url = String(video?.url || video?.link || "").trim();
  if (/^https:\/\/(?:www\.)?eporner\.com\/(?:video-|hd-porn\/)/i.test(url)) return url;
  const id = epVideoId(video);
  return id ? EP_BASE + "/embed/" + encodeURIComponent(id) : "";
}
function epTags(video) {
  const raw = video?.keywords || video?.tags || "";
  return Array.isArray(raw) ? raw.join(" ") : String(raw);
}
async function epornerSearch(query, page = 1) {
  const params = new URLSearchParams({
    query, per_page: "100", page: String(page), thumbsize: "big",
    order: "most-popular", gay: "0", lq: "1", format: "json"
  });
  const response = await fetch(EP_API + "?" + params.toString(), {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data.videos) ? data.videos : (Array.isArray(data) ? data : []);
}
async function epornerCatalog(catalogId, skip) {
  const queries = {
    xh_german_studio: ["German"],
    xh_german_all: ["German Dub", "Deutsch", "German"],
    xh_hentai_german_dub: ["Hentai German Dub", "German Hentai", "Hentai Deutsch"],
    xh_mario_salieri_german_dub: ["Mario Salieri German Dub", "Mario Salieri German"],
    xh_free_german_platforms: ["German Dub", "German dubbed", "German audio", "Deutsch synchronisiert", "Deutsche Tonspur", "Deutsch vertont"]
  }[catalogId] || [];
  const batches = await Promise.all(queries.map(q => epornerSearch(q, 1)));
  const seen = new Set();
  const videos = [];
  for (const batch of batches) {
    for (const video of batch) {
      const id = epVideoId(video);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const searchable = (String(video.title || "") + " " + epTags(video)).toLowerCase();
      const germanDub = isGermanDub(searchable);
      const hentai = /hentai|anime|animated/.test(searchable);
      const salieri = /mario salieri|salieri/.test(searchable);
      if (["xh_german_studio", "xh_german_all"].includes(catalogId) && !germanDub) continue;
      if (catalogId === "xh_hentai_german_dub" && !(germanDub && hentai)) continue;
      if (catalogId === "xh_mario_salieri_german_dub" && !(germanDub && salieri)) continue;
      videos.push(video);
    }
  }
  const page = videos.slice(skip, skip + 40);
  return page.map(video => {
    const id = epVideoId(video);
    const url = epVideoUrl(video);
    const poster = normalizeImage(video.default_thumb || video.thumb || video.image || video.thumbnail);
    const meta = { type: "movie", name: String(video.title || "Eporner Video").trim(),
      poster: poster || undefined, background: poster || undefined, posterShape: "landscape",
      description: epTags(video) || undefined, url: url || undefined };
    return { ...meta, id: packedId("ep:", { v: id, ...meta }) };
  });
}
async function epornerMetadata(id) {
  const videoId = epIdFromId(id);
  if (!videoId) return null;
  const params = new URLSearchParams({ id: videoId, per_page: "1", thumbsize: "big", format: "json" });
  const response = await fetch(EP_API + "?" + params.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const data = await response.json();
  const video = (Array.isArray(data.videos) ? data.videos : [])[0];
  if (!video) return null;
  const poster = normalizeImage(video.default_thumb || video.thumb || video.image || video.thumbnail);
  const meta = { type: "movie", name: String(video.title || "Eporner Video"),
    poster: poster || undefined, background: poster || undefined, posterShape: "landscape",
    description: epTags(video) || undefined, url: epVideoUrl(video) || undefined };
  return { ...meta, id: packedId("ep:", { v: videoId, ...meta }) };
}
async function epornerStreams(id) {
  const videoId = epIdFromId(id);
  if (!videoId) return [];

  // Use Eporner's documented single-video endpoint first. The search
  // endpoint remains a compatibility fallback for older API responses.
  const detailParams = new URLSearchParams({ id: videoId, thumbsize: "big", format: "json" });
  const searchParams = new URLSearchParams({ id: videoId, per_page: "1", thumbsize: "big", format: "json" });
  const requestJson = async url => {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" }
    });
    if (!response.ok) return null;
    return response.json();
  };
  let data = await requestJson(EP_BASE + "/api/v2/video/id/?" + detailParams.toString());
  const unwrapVideo = payload => {
    const root = payload?.data || payload;
    return root?.video || (Array.isArray(root?.videos) ? root.videos[0] : null) ||
      (Array.isArray(root) ? root[0] : null) || (root && root.id ? root : null);
  };
  let video = unwrapVideo(data);
  if (!video) {
    data = await requestJson(EP_API + "?" + searchParams.toString());
    video = unwrapVideo(data);
  }
  // The official Eporner ID API documents metadata fields, not playable media
  // URLs. Some responses therefore contain a valid video but no sources.
  // Read only directly exposed MP4/HLS URLs from the public embed HTML as fallback.
  video = video || { title: "Eporner" };
  const candidates = [];
  const add = (value, quality) => {
    if (value && typeof value === "object") {
      quality = value.quality || value.label || quality;
      value = value.url || value.src || value.file;
    }
    if (typeof value !== "string") return;
    const url = decode(value).trim();
    // Only accept HTTPS media files from Eporner's own delivery domains.
    if (!/^https:\/\//i.test(url) || !/\.(?:mp4|m3u8)(?:$|[?#])/i.test(url)) return;
    let host = "";
    try { host = new URL(url).hostname.toLowerCase(); } catch (_) { return; }
    if (!(host === "eporner.com" || host.endsWith(".eporner.com"))) return;
    candidates.push({ url, quality: String(quality || "") });
  };

  const defaultQuality = video.default_quality;
  add(defaultQuality, defaultQuality && typeof defaultQuality === "object" ? defaultQuality.quality : "");
  if (video.all_qualities && typeof video.all_qualities === "object") {
    for (const [quality, value] of Object.entries(video.all_qualities)) add(value, quality);
  }
  if (Array.isArray(video.sources)) {
    for (const source of video.sources) add(source);
  }
  if (Array.isArray(video.qualities)) {
    for (const source of video.qualities) add(source);
  }

  // Eporner's API may group playable files as sources.hls/mp4 -> quality -> {src/url}.
  // Walk only the API-provided source object; add() still enforces HTTPS media URLs
  // and the provider's own delivery domain.
  const walkSources = (node, quality = "") => {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const item of node) walkSources(item, quality);
      return;
    }
    if (typeof node !== "object") return;
    const label = String(node.quality || node.label || node.format || quality || "");
    if (typeof node.src === "string" || typeof node.url === "string" || typeof node.file === "string") {
      add(node, label);
    }
    for (const [key, value] of Object.entries(node)) {
      if (value && typeof value === "object") walkSources(value, /^(?:hls|mp4)$/i.test(key) ? key : label || key);
    }
  };
  walkSources(video.sources);

  // The public API's documented ID response contains metadata only. The
  // embed page may expose the same public player sources directly in its HTML.
  // Never execute its scripts, decode obfuscated payloads, or bypass restrictions.
  try {
    const embedHtml = await getHtml(EP_BASE + "/embed/" + encodeURIComponent(videoId));
    if (embedHtml) {
      const visibleHtml = decode(embedHtml);
      const mediaPattern = /https:\/\/[^"'\s<>]+?\.(?:mp4|m3u8)(?:\?[^"'\s<>]*)?/gi;
      let mediaMatch;
      while ((mediaMatch = mediaPattern.exec(visibleHtml)) !== null) {
        add(mediaMatch[0], "");
      }
    }
  } catch (error) {
    console.warn("[CVN stream] Eporner embed source lookup failed:", error?.message || error);
  }

  const uniqueCandidates = [];
  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate.url)) continue;
    seen.add(candidate.url);
    uniqueCandidates.push(candidate);
  }
  // Prefer the highest known quality, while retaining a few fallbacks.
  uniqueCandidates.sort((a, b) => {
    const qa = Number((a.quality.match(/\d+/) || [0])[0]);
    const qb = Number((b.quality.match(/\d+/) || [0])[0]);
    return qb - qa;
  });
  // Probe only the response headers and a tiny byte range before exposing a
  // candidate to Nuvio. This distinguishes a reachable media file from a
  // stale URL or a source that rejects ordinary server-side playback requests.
  if (uniqueCandidates.length) {
    const probe = uniqueCandidates[0].url;
    try {
      const response = await fetch(probe, {
        method: "GET",
        headers: {
          Range: "bytes=0-1",
          Accept: "video/*,application/vnd.apple.mpegurl,*/*",
          "User-Agent": "Mozilla/5.0",
          Referer: EP_BASE + "/",
          Origin: EP_BASE
        },
        redirect: "follow",
        signal: AbortSignal.timeout(8000)
      });
      const host = new URL(response.url || probe).hostname.toLowerCase();
      console.info("[CVN stream] Eporner probe", JSON.stringify({
        host,
        status: response.status,
        contentType: response.headers.get("content-type") || "",
        contentRange: response.headers.get("content-range") || "",
        acceptRanges: response.headers.get("accept-ranges") || ""
      }));
      if (response.body) await response.body.cancel().catch(() => {});
    } catch (error) {
      console.warn("[CVN stream] Eporner probe failed", String(error?.name || "Error"));
    }
  }

  const title = String(video.title || "Eporner");
  return uniqueCandidates.slice(0, 5).map(candidate => ({
    name: "CVN Eporner",
    title: title + (candidate.quality ? " · " + candidate.quality : ""),
    url: candidate.url,
    behaviorHints: {
      notWebReady: true,
      filename: title.replace(/[\\/:*?"<>|]+/g, " ").trim() + (candidate.url.includes(".m3u8") ? ".m3u8" : ".mp4"),
      proxyHeaders: {
        request: {
          Referer: EP_BASE + "/",
          Origin: EP_BASE
        }
      }
    }
  }));
}

const CATALOG_SEARCHES = {
  // Search phrases are public-site queries; they do not guarantee language or studio metadata.
  xh_german_studio: "German",
  xh_hentai_german_dub: "Hentai German Dub",
  xh_mario_salieri_german_dub: "Mario Salieri German Dub",
  xh_german_all: "German Dub",
  xh_free_german_platforms: "German Dub"
};
async function catalog(args) {
  const skip = Math.max(0, Number(args.extra?.skip || 0));
  const search = String(args.extra?.search || CATALOG_SEARCHES[args.id] || "").trim();

  // Each upstream is isolated: a timeout, network error, or temporary API
  // outage at one provider must not make the entire Nuvio catalog fail.
  const safe = async (label, task) => {
    try {
      return await task();
    } catch (error) {
      console.warn("[CVN catalog] " + label + " unavailable:", error?.message || error);
      return [];
    }
  };

  // AdultEmbed's documented API exposes an iframe player only, not a
  // direct MP4/HLS source. Nuvio's native player cannot decode that HTML page,
  // so omit those entries rather than presenting titles that cannot play.
  // Eporner's current media host rejects ordinary playback requests (HTTP 403).
  // Keep legacy ep: IDs resolvable, but stop advertising new Eporner entries
  // until the provider exposes a publicly playable MP4/HLS source.
  const [epMetas, xhMetas] = await Promise.all([
    Promise.resolve([]),
    safe("xHamster", async () => {
      if (search) {
        const links = await searchVideoLinks(search);
        const metas = await Promise.all(links.slice(0, 80).map(pageMeta));
        return metas.filter(meta => meta && isGermanDub([meta.name, meta.description].join(" ")));
      }
      const html = await getHtml(BASE + "/");
      const links = videoLinks(html);
      const metas = await Promise.all(links.slice(0, 80).map(pageMeta));
      return metas.filter(Boolean);
    })
  ]);

  // Merge before pagination so skip is applied once to the combined catalog.
  const seen = new Set();
  const merged = [];
  for (const meta of [...xhMetas, ...epMetas]) {
    if (!meta || !meta.id || seen.has(meta.id)) continue;
    seen.add(meta.id);
    // Keep the exact catalog preview in memory so the subsequent detail
    // request does not depend on a second, potentially throttled provider call.
    META_CACHE.set(String(meta.id), meta);
    if (META_CACHE.size > 2000) {
      const oldest = META_CACHE.keys().next().value;
      META_CACHE.delete(oldest);
    }
    merged.push(meta);
  }
  return { metas: merged.slice(skip, skip + 40), cacheMaxAge: search ? 300 : 900 };
}

async function metadata(id) {
  const key = String(id || "");
  const embedded = key.startsWith("ae:") ? unpackedId(key, "ae:") : key.startsWith("ep:") ? unpackedId(key, "ep:") : null;
  if (embedded?.name && embedded?.type === "movie") return { meta: { ...embedded, id: key } };
  const cached = META_CACHE.get(key);
  if (cached) {
    return { meta: { ...cached } };
  }
  if (key.startsWith("ae:")) {
    const meta = await adultEmbedMetadata(id);
    return { meta: meta || { id: String(id), type: "movie", name: "AdultEmbed Video" } };
  }
  if (key.startsWith("ep:")) {
    const meta = await epornerMetadata(id);
    return { meta: meta || { id: String(id), type: "movie", name: "Eporner Video" } };
  }
  const url = urlFromId(key);
  if (!url) {
    return { meta: { id: String(id || ""), type: "movie", name: "xHamster Video" } };
  }
  const meta = await pageMeta(url);
  // Always return a usable metadata object if the public page temporarily
  // withholds its OG tags or cannot be fetched. Nuvio expects $meta to exist.
  return {
    meta: meta || {
      id: makeId(url),
      type: "movie",
      name: "xHamster Video",
      url
    }
  };
}
async function streams(id) {
  if (String(id || "").startsWith("ae:")) return { streams: await adultEmbedStreams(id) };
  if (String(id || "").startsWith("ep:")) return { streams: await epornerStreams(id) };
  const url = urlFromId(id);
  if (!url) return { streams: [] };
  const html = await getHtml(url);
  if (!html) return { streams: [] };

  const candidates = [];
  const addCandidate = value => {
    if (typeof value !== "string") return;
    const candidate = absolute(value);
    // Only use ordinary, directly exposed HTTPS media URLs. Do not decode
    // obfuscated player payloads or work around access restrictions.
    if (/^https:\/\//i.test(candidate) && /\.(?:m3u8|mp4)(?:$|[?#])/i.test(candidate)) {
      candidates.push(candidate);
    }
  };

  // Current xHamster pages expose player configuration in initials-script.
  // Accept only URLs already present in clear text in that public JSON.
  const initialsMatch = html.match(/<script[^>]+id=["']initials-script["'][^>]*>([\s\S]*?)<\/script>/i);
  if (initialsMatch) {
    try {
      const initials = JSON.parse(initialsMatch[1].trim());
      const sources = initials?.xplayerSettings?.sources;
      if (sources && typeof sources === "object") {
        for (const group of [sources.hls, sources.standard]) {
          if (!group || typeof group !== "object") continue;
          for (const entries of Object.values(group)) {
            for (const entry of Array.isArray(entries) ? entries : [entries]) {
              if (!entry || typeof entry !== "object") continue;
              addCandidate(entry.url);
              addCandidate(entry.fallback);
            }
          }
        }
      }

      // Newer public page payloads may expose plain MP4/HLS URLs under
      // initials.videoModel.sources. Ignore encrypted/non-URL values; do not
      // attempt to decode protected player payloads.
      const walkPublicSources = node => {
        if (!node) return;
        if (Array.isArray(node)) {
          for (const item of node) walkPublicSources(item);
          return;
        }
        if (typeof node === "string") {
          addCandidate(node);
          return;
        }
        if (typeof node === "object") {
          for (const value of Object.values(node)) walkPublicSources(value);
        }
      };
      walkPublicSources(initials?.videoModel?.sources);
    } catch (_) {
      // A malformed or non-JSON player payload is not a playable source.
    }
  }

  // Fallback for pages that publish direct media URLs in markup or JSON.
  const patterns = [
    /["'](?:contentUrl|src|file|videoUrl|url)["']\s*:\s*["']([^"']+\.(?:m3u8|mp4)(?:\?[^"']*)?)["']/gi,
    /<(?:source|video)[^>]+(?:src|data-src)\s*=\s*["']([^"']+\.(?:m3u8|mp4)(?:\?[^"']*)?)["']/gi
  ];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(html)) !== null) addCandidate(decode(match[1]));
  }

  const urls = unique(candidates);
  const title = metaTag(html, "og:title") || "xHamster";
  if (!urls.length) {
    // The page itself is not a playable stream. Keep playback inside Nuvio
    // by returning an empty stream list instead of an external browser link.
    return { streams: [] };
  }
  return {
    streams: urls.slice(0, 5).map(u => ({
      name: "CVN xHamster",
      title,
      url: u,
      behaviorHints: {
        notWebReady: true,
        proxyHeaders: {
          request: {
            Referer: url,
            Origin: "https://ge.xhamster.com"
          }
        }
      }
    }))
  };
}
module.exports = { catalog, metadata, streams, videoLinks, urlFromId, epornerSearch, adultEmbedSearch };
