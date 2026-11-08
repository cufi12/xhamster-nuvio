// Apify-backed xHamster catalog adapter for the Stremio-compatible Nuvio addon.
// IDs are deterministic from the canonical public video page URL.
// Playback is returned only after a bounded HTTP media-type probe succeeds.

const ACTOR_URL = process.env.APIFY_ACTOR_URL ||
  "https://api.apify.com/v2/acts/scrapers_lat~xhamster-scraper/run-sync-get-dataset-items";
const MAX_VIDEOS = Math.min(100, Math.max(1, Number(process.env.APIFY_MAX_VIDEOS || 40)));
const SORTS = new Set(["relevance", "newest", "best"]);
const ID_PREFIX = "xh:";
const videoCache = new Map();
const MEDIA_TYPES = [
  "video/", "application/vnd.apple.mpegurl", "application/x-mpegurl",
  "application/dash+xml", "application/mp4"
];

function first(item, keys) {
  for (const key of keys) {
    const value = item && item[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function asText(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function canonicalPageUrl(value) {
  try {
    const url = new URL(asText(value));
    if (!["http:", "https:"].includes(url.protocol)) return "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function pageUrlOf(item) {
  return canonicalPageUrl(first(item, ["pageUrl", "pageURL", "videoPageUrl", "videoPage", "url", "link", "webUrl"]));
}

function directMediaCandidates(item) {
  const candidates = [];
  for (const key of ["directMediaUrl", "directUrl", "mediaUrl", "fileUrl", "downloadUrl"]) {
    const value = asText(item?.[key]);
    if (value) candidates.push(value);
  }
  if (Array.isArray(item?.sources)) {
    for (const source of item.sources) {
      const value = asText(typeof source === "string" ? source : source?.url);
      if (value) candidates.push(value);
    }
  }
  return [...new Set(candidates)].filter(value => {
    try { return ["http:", "https:"].includes(new URL(value).protocol); }
    catch { return false; }
  });
}

function previewCandidates(item) {
  return [...new Set(["trailerUrl", "previewUrl", "trailer", "preview"]
    .map(key => asText(item?.[key]))
    .filter(value => {
      try { return ["http:", "https:"].includes(new URL(value).protocol); }
      catch { return false; }
    }))];
}

function normalize(item) {
  const title = asText(first(item, ["title", "name", "videoTitle"])) || "Untitled video";
  const pageUrl = pageUrlOf(item);
  const poster = asText(first(item, ["thumbnail", "thumbnailUrl", "thumb", "image", "imageUrl", "poster", "posterUrl"]));
  const description = asText(first(item, ["description", "videoDescription", "descriptionText", "metaDescription", "summary", "text"]));
  const duration = first(item, ["duration", "durationSeconds", "length"]);
  const creator = asText(first(item, ["pornstar", "creator", "performer", "author", "uploader"]));
  const channel = asText(first(item, ["channel", "channelName", "studio"]));
  const tagsValue = first(item, ["tags", "tagList", "keywords"]);
  const tags = Array.isArray(tagsValue) ? tagsValue.map(asText).filter(Boolean) :
    (typeof tagsValue === "string" ? tagsValue.split(/[,|]/).map(s => s.trim()).filter(Boolean) : []);
  const views = first(item, ["views", "viewCount"]);
  const date = asText(first(item, ["publishedAt", "uploadDate", "date", "createdAt"]));
  return { title, pageUrl, poster, description, duration, creator, channel, tags, views, date, mediaCandidates: directMediaCandidates(item), previewCandidates: previewCandidates(item) };
}

function encodeId(item) {
  const pageUrl = typeof item === "string" ? canonicalPageUrl(item) : normalize(item).pageUrl;
  if (!pageUrl) return "";
  return ID_PREFIX + Buffer.from(pageUrl, "utf8").toString("base64url");
}

function decodeId(id) {
  const value = String(id || "");
  if (!value.startsWith(ID_PREFIX)) return null;
  try {
    const pageUrl = canonicalPageUrl(Buffer.from(value.slice(ID_PREFIX.length), "base64url").toString("utf8"));
    if (!pageUrl || encodeId(pageUrl) !== value) return null;
    return { pageUrl };
  } catch {
    return null;
  }
}

function actorInput(args = {}) {
  const filters = args.extra && typeof args.extra === "object" ? { ...args, ...args.extra } : args;
  const input = { maxVideos: MAX_VIDEOS, withDetails: true };
  input.sort = SORTS.has(String(filters.sort || "")) ? String(filters.sort) : "relevance";
  const search = asText(filters.search);
  if (search) input.searchQuery = search.slice(0, 200);
  for (const field of ["category", "tag", "pornstar", "channel"]) {
    const value = asText(filters[field]);
    if (value) input[field] = value.slice(0, 160);
  }
  return input;
}

async function runActor(input) {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    console.warn("[xHamster] APIFY_TOKEN is not configured");
    return [];
  }
  const response = await fetch(new URL(ACTOR_URL), {
    method: "POST",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(180000)
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error("Apify actor request failed (" + response.status + "): " + detail);
  }
  const data = await response.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  return [];
}

function catalogIds() {
  return new Set(["xh_latest", "xh_search", "xh_category", "xh_tag", "xh_creator", "xh_channel", "xh_anime_german_dub", "xh_films_german_dub", "xh_german_studios"]);
}

function searchableMetadata(item) {
  const values = [];
  for (const key of ["title", "name", "description", "categories", "tags", "channels", "channel", "studio", "uploader", "creator"]) {
    const value = item?.[key];
    if (Array.isArray(value)) values.push(...value.map(asText));
    else if (value !== undefined && value !== null) values.push(asText(value));
  }
  return values.join(" ").toLowerCase();
}

function matchesGermanDub(item) {
  // Decide from the actual description/body text only, never from the title.
  const descriptionFields = ["description", "videoDescription", "descriptionText", "metaDescription", "summary", "text", "details", "content", "body"];
  const description = descriptionFields
    .map(key => item?.[key])
    .flatMap(value => Array.isArray(value) ? value : [value])
    .filter(value => typeof value === "string")
    .join(" ")
    .toLowerCase();
  return /\b(german\s*dub(?:bed)?|dubbed\s*in\s*german|in\s*german|german\s*(?:language|audio|version|voiceover)|deutsch\s*synchronisiert|deutsche\s*(?:synchronisation|synchro|fassung|tonspur)|deutschsprachig|deutsch\s*vertont)\b/i.test(description);
}

function matchesAnime(item) {
  return /\b(anime|hentai|japanese\s*animation)\b/i.test(searchableMetadata(item));
}

function isPlayableFullEntry(item, minimumSeconds = 4800, maximumSeconds = 7200) {
  const type = asText(item?.videoType).toLowerCase();
  const title = asText(item?.title).toLowerCase();
  const duration = Number(first(item, ["durationSeconds", "duration"]));
  if (type && !["video", "full", "movie"].includes(type)) return false;
  if (/\b(preview|trailer|teaser|clip|excerpt|vorschau|ausschnitt|szene)\b/i.test(title)) return false;
  return Number.isFinite(duration) && duration >= minimumSeconds && duration <= maximumSeconds;
}

function matchesGermanStudio(item) {
  const studioFields = [item?.studio, item?.channel, item?.channelName, item?.channels]
    .flatMap(value => Array.isArray(value) ? value : [value])
    .map(asText).join(" ");
  return /\b(magma|mmv)\b/i.test(studioFields);
}

async function catalog(args = {}) {
  if (args.type !== "movie" || !catalogIds().has(String(args.id || ""))) return { metas: [], cacheMaxAge: 300 };
  const input = actorInput(args);
  if (args.id === "xh_anime_german_dub") input.category = "anime";
  if (args.id === "xh_films_german_dub") input.category = "full-movie";
  if (args.id === "xh_german_studios") input.searchQuery = "German studio";
  if (args.id === "xh_latest") {
    // The actor has no global homepage mode: an empty input returns no items.
    // Use its documented prefilled category as the default home catalog.
    input.category = "amateur";
    input.sort = "newest";
  }
  const idToField = { xh_category: "category", xh_tag: "tag", xh_creator: "pornstar", xh_channel: "channel" };
  const field = idToField[args.id];
  if (field && !input[field]) return { metas: [], cacheMaxAge: 120 };
  let items;
  if (args.id === "xh_films_german_dub") {
    // Use xHamster's own "Full Movie" filter, not keyword guesses.
    items = await runActor({ ...input, category: "full-movie", sort: "relevance" });
    items = items.filter(item => isPlayableFullEntry(item, 4800, 7200) && matchesGermanDub(item) && !matchesAnime(item));
  } else {
    items = await runActor(input);
  }
  if (args.id === "xh_anime_german_dub") items = items.filter(item => matchesAnime(item) && matchesGermanDub(item));
  if (args.id === "xh_german_studios") items = items.filter(item => matchesGermanStudio(item) && isPlayableFullEntry(item, 5400, 7200));
  const metas = items.map(item => {
    const video = normalize(item);
    if (!video.title || !video.pageUrl) return null;
    const id = encodeId(video.pageUrl);
    videoCache.set(id, video);
    return {
      id, type: "movie", name: video.title,
      poster: video.poster || undefined,
      description: video.description || undefined,
      runtime: typeof video.duration === "number" ? String(Math.round(video.duration / 60)) + " min" : undefined,
      genres: video.tags.length ? video.tags : undefined,
      releaseInfo: video.date || undefined
    };
  }).filter(Boolean);
  return { metas, cacheMaxAge: 300 };
}

async function getVideo(id) {
  const decoded = decodeId(id);
  if (!decoded) return null;
  if (videoCache.has(id)) return videoCache.get(id);
  const items = await runActor({ maxVideos: MAX_VIDEOS, withDetails: true, searchQuery: decoded.pageUrl, sort: "relevance" });
  const match = items.map(normalize).find(video => video.pageUrl === decoded.pageUrl);
  if (match) videoCache.set(id, match);
  return match || null;
}

async function metadata(id) {
  const video = await getVideo(id);
  if (!video) return { meta: null };
  return {
    meta: {
      id: String(id), type: "movie", name: video.title,
      poster: video.poster || undefined,
      description: video.description || undefined,
      runtime: typeof video.duration === "number" ? String(Math.round(video.duration / 60)) + " min" : undefined,
      genres: video.tags?.length ? video.tags : undefined,
      releaseInfo: video.date || undefined,
      website: video.pageUrl || undefined,
      director: video.creator || undefined,
      country: video.channel || undefined
    }
  };
}

function isMediaType(value) {
  const type = String(value || "").split(";")[0].trim().toLowerCase();
  return MEDIA_TYPES.some(prefix => prefix.endsWith("/") ? type.startsWith(prefix) : type === prefix);
}

async function verifyMediaUrl(candidate) {
  let url;
  try {
    url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return null;
  } catch { return null; }

  for (const method of ["HEAD", "GET"]) {
    try {
      const response = await fetch(url, {
        method,
        headers: method === "GET" ? { Range: "bytes=0-0" } : {},
        redirect: "follow",
        signal: AbortSignal.timeout(10000)
      });
      const validStatus = response.ok || (method === "GET" && response.status === 206);
      const validType = isMediaType(response.headers.get("content-type"));
      const finalUrl = response.url || url.toString();
      if (validStatus && validType && ["http:", "https:"].includes(new URL(finalUrl).protocol)) {
        if (method === "GET") response.body?.cancel?.().catch?.(() => {});
        return finalUrl;
      }
      if (method === "GET") response.body?.cancel?.().catch?.(() => {});
      if (method === "HEAD" && response.status >= 400) continue;
      if (method === "HEAD" && !validType) continue;
    } catch {
      // Try the bounded range request if HEAD is unsupported or unavailable.
    }
  }
  return null;
}

async function streams(id) {
  const video = await getVideo(id);
  if (!video) return { streams: [] };
  const candidates = [...new Set(video.mediaCandidates || [])];
  // Prefer HLS playlists: Nuvio can use adaptive bitrate where its player supports HLS.
  // Keep verified MP4/direct files as fallback, rather than treating an unverified
  // playlist as playable.
  candidates.sort((a, b) => {
    const isHls = value => /\.m3u8(?:$|[?#])/i.test(value);
    return Number(isHls(b)) - Number(isHls(a));
  });
  const verified = [];
  for (const candidate of candidates.slice(0, 6)) {
    const url = await verifyMediaUrl(candidate);
    if (url && !verified.includes(url)) verified.push(url);
  }
  // Never expose trailer/preview URLs as playback streams.
  return {
    streams: verified.map((url, index) => {
      const hls = /\.m3u8(?:$|[?#])/i.test(url);
      return {
        name: hls ? "HLS (adaptiv)" : "MP4 / Direktstream (Fallback)",
        title: video.title + (verified.length > 1 ? " · " + (hls ? "HLS" : "Fallback " + index) : ""),
        url
      };
    })
  };
}

module.exports = { catalog, metadata, streams, normalize, encodeId, decodeId, actorInput, directMediaCandidates, verifyMediaUrl, matchesGermanDub, matchesAnime, isPlayableFullEntry, matchesGermanStudio };
