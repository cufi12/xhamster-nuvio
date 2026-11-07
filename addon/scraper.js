// Apify-backed xHamster catalog adapter for the Stremio-compatible Nuvio addon.
// Only public actor results and explicitly supplied direct media URLs are exposed.
// The addon does not bypass logins, age checks, DRM, CAPTCHAs or anti-bot controls.

const ACTOR_URL = process.env.APIFY_ACTOR_URL ||
  "https://api.apify.com/v2/acts/scrapers_lat~xhamster-scraper/run-sync-get-dataset-items";
const MAX_VIDEOS = Math.min(100, Math.max(1, Number(process.env.APIFY_MAX_VIDEOS || 40)));
const SORTS = new Set(["relevance", "newest", "best"]);
const ID_PREFIX = "xh:";

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

function pageUrlOf(item) {
  const value = first(item, ["pageUrl", "pageURL", "videoPageUrl", "videoPage", "url", "link", "webUrl"]);
  const text = asText(value);
  try {
    const parsed = new URL(text);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function normalize(item) {
  const title = asText(first(item, ["title", "name", "videoTitle"])) || "Untitled video";
  const pageUrl = pageUrlOf(item);
  const poster = asText(first(item, ["thumbnail", "thumbnailUrl", "thumb", "image", "imageUrl", "poster", "posterUrl"]));
  const description = asText(first(item, ["description", "summary", "text"]));
  const duration = first(item, ["duration", "durationSeconds", "length"]);
  const creator = asText(first(item, ["pornstar", "creator", "performer", "author", "uploader"]));
  const channel = asText(first(item, ["channel", "channelName", "studio"]));
  const tagsValue = first(item, ["tags", "tagList", "keywords"]);
  const tags = Array.isArray(tagsValue) ? tagsValue.map(asText).filter(Boolean) :
    (typeof tagsValue === "string" ? tagsValue.split(/[,|]/).map(s => s.trim()).filter(Boolean) : []);
  const views = first(item, ["views", "viewCount"]);
  const date = asText(first(item, ["publishedAt", "uploadDate", "date", "createdAt"]));
  return { title, pageUrl, poster, description, duration, creator, channel, tags, views, date };
}

function encodeId(item) {
  const normalized = normalize(item);
  return ID_PREFIX + Buffer.from(JSON.stringify(normalized)).toString("base64url");
}

function decodeId(id) {
  const value = String(id || "");
  if (!value.startsWith(ID_PREFIX)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value.slice(ID_PREFIX.length), "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object" || !parsed.title) return null;
    return parsed;
  } catch {
    return null;
  }
}

function actorInput(args = {}) {
  const input = { maxVideos: MAX_VIDEOS, withDetails: true };
  const sort = SORTS.has(String(args.sort || "")) ? String(args.sort) : "relevance";
  input.sort = sort;
  const search = asText(args.search);
  if (search) input.searchQuery = search.slice(0, 200);
  const fields = ["category", "tag", "pornstar", "channel"];
  for (const field of fields) {
    const value = asText(args[field]);
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
  const url = new URL(ACTOR_URL);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
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
  return new Set(["xh_search", "xh_category", "xh_tag", "xh_creator", "xh_channel"]);
}

async function catalog(args = {}) {
  if (args.type !== "movie" || !catalogIds().has(String(args.id || ""))) {
    return { metas: [], cacheMaxAge: 300 };
  }
  const input = actorInput(args);
  const idToField = {
    xh_category: "category",
    xh_tag: "tag",
    xh_creator: "pornstar",
    xh_channel: "channel"
  };
  const field = idToField[args.id];
  if (field && !input[field]) return { metas: [], cacheMaxAge: 120 };
  const items = await runActor(input);
  const metas = items.map(item => {
    const video = normalize(item);
    if (!video.title || !video.pageUrl) return null;
    return {
      id: encodeId(item),
      type: "movie",
      name: video.title,
      poster: video.poster || undefined,
      description: video.description || undefined,
      runtime: typeof video.duration === "number" ? String(Math.round(video.duration / 60)) + " min" : undefined,
      genres: video.tags.length ? video.tags : undefined,
      releaseInfo: video.date || undefined
    };
  }).filter(Boolean);
  return { metas, cacheMaxAge: 300 };
}

async function metadata(id) {
  const video = decodeId(id);
  if (!video) return { meta: null };
  return {
    meta: {
      id: String(id),
      type: "movie",
      name: video.title,
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

function directMediaUrls(item) {
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
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) &&
        /\.(mp4|m4v|mov|webm|m3u8|mpd)(?:$|[?#])/i.test(url.href);
    } catch {
      return false;
    }
  });
}

async function streams(id) {
  const video = decodeId(id);
  if (!video) return { streams: [] };
  // The dataset item is intentionally not embedded in the ID, so no guessed
  // page URL is ever returned as a playable stream. Direct stream support is
  // enabled only when the actor provides a verified media URL in the item.
  return { streams: [] };
}

module.exports = { catalog, metadata, streams, normalize, decodeId, actorInput, directMediaUrls };
