const BASE = "https://ge.xhamster.com";
const EP_API = "https://www.eporner.com/api/v2/video/search/";
const EP_BASE = "https://www.eporner.com";
const AE_API = "https://adultembed.com/api/v1";
const AE_BASE = "https://adultembed.com";

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


function aeIdFromId(id) {
  const value = String(id || "");
  return value.startsWith("ae:") ? value.slice(3) : "";
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
    xh_mario_salieri_german_dub: ["Mario Salieri German Dub", "Mario Salieri Deutsch"]
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
    const poster = video.thumbnail || video.thumb || video.image || video.poster;
    return {
      id: "ae:" + id, type: "movie",
      name: String(translation.title || video.title || "AdultEmbed Video"),
      poster: poster || undefined, background: poster || undefined,
      posterShape: "landscape",
      description: String(translation.description || video.description || ""),
      url: aePlayerUrl(video) || undefined
    };
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
  const poster = video.thumbnail || video.thumb || video.image || video.poster;
  return {
    id: "ae:" + videoId, type: "movie",
    name: String(translation.title || video.title || "AdultEmbed Video"),
    poster: poster || undefined, background: poster || undefined,
    posterShape: "landscape",
    description: String(translation.description || video.description || ""),
    url: aePlayerUrl(video) || (AE_BASE + "/player/embed/" + encodeURIComponent(videoId) + "/")
  };
}
async function adultEmbedStreams(id) {
  const videoId = aeIdFromId(id);
  if (!videoId) return [];
  const meta = await adultEmbedMetadata(id);
  const playerUrl = meta?.url || (AE_BASE + "/player/embed/" + encodeURIComponent(videoId) + "/");
  return [{ name: "CVN AdultEmbed Player", title: meta?.name || "AdultEmbed", url: playerUrl }];
}

function epIdFromId(id) {
  const value = String(id || "");
  return value.startsWith("ep:") ? value.slice(3) : "";
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
    xh_mario_salieri_german_dub: ["Mario Salieri German Dub", "Mario Salieri German"]
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
    const poster = video.default_thumb || video.thumb || video.image || video.thumbnail;
    const title = String(video.title || "Eporner Video").trim();
    return {
      id: "ep:" + id, type: "movie", name: title,
      poster: poster || undefined, background: poster || undefined,
      posterShape: "landscape", description: epTags(video) || undefined,
      url: url || undefined
    };
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
  const poster = video.default_thumb || video.thumb || video.image || video.thumbnail;
  return {
    id: "ep:" + videoId, type: "movie", name: String(video.title || "Eporner Video"),
    poster: poster || undefined, background: poster || undefined,
    posterShape: "landscape", description: epTags(video) || undefined,
    url: epVideoUrl(video) || undefined
  };
}
async function epornerStreams(id) {
  const videoId = epIdFromId(id);
  if (!videoId) return [];
  const params = new URLSearchParams({ id: videoId, per_page: "1", thumbsize: "big", format: "json" });
  const response = await fetch(EP_API + "?" + params.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) return [];
  const data = await response.json();
  const video = (Array.isArray(data.videos) ? data.videos : [])[0];
  if (!video) return [];
  const urls = [];
  if (video.default_quality?.url) urls.push(video.default_quality.url);
  if (video.all_qualities && typeof video.all_qualities === "object") {
    for (const value of Object.values(video.all_qualities)) if (typeof value === "string") urls.push(value);
  }
  return unique(urls.filter(url => /^https:\/\//i.test(url) && /\.(?:mp4|m3u8)(?:$|[?#])/i.test(url)))
    .slice(0, 5).map(url => ({ name: "CVN Eporner", title: video.title || "Eporner", url }));
}

const CATALOG_SEARCHES = {
  // Search phrases are public-site queries; they do not guarantee language or studio metadata.
  xh_german_studio: "German",
  xh_hentai_german_dub: "Hentai German Dub",
  xh_mario_salieri_german_dub: "Mario Salieri German Dub",
  xh_german_all: "German Dub"
};
async function catalog(args) {
  const skip = Math.max(0, Number(args.extra?.skip || 0));
  const [epMetas, aeMetas] = await Promise.all([
    epornerCatalog(args.id, skip), adultEmbedCatalog(args.id, skip)
  ]);
  const search = String(args.extra?.search || CATALOG_SEARCHES[args.id] || "").trim();
  if (!search) {
    // The front page is a public, ordinary listing; no access controls are bypassed.
    const html = await getHtml(BASE + "/");
    const links = videoLinks(html);
    const metas = await Promise.all(links.slice(skip, skip + 40).map(pageMeta));
    return { metas: [...metas.filter(Boolean), ...epMetas, ...aeMetas], cacheMaxAge: 900 };
  }
  const links = await searchVideoLinks(search);
  const metas = await Promise.all(links.slice(skip, skip + 40).map(pageMeta));
  const germanMetas = metas.filter(meta => meta && isGermanDub([meta.name, meta.description].join(" ")));
  return { metas: [...germanMetas, ...epMetas, ...aeMetas], cacheMaxAge: 300 };
}
async function metadata(id) {
  if (String(id || "").startsWith("ae:")) {
    const meta = await adultEmbedMetadata(id);
    return { meta: meta || { id: String(id), type: "movie", name: "AdultEmbed Video" } };
  }
  if (String(id || "").startsWith("ep:")) {
    const meta = await epornerMetadata(id);
    return { meta: meta || { id: String(id), type: "movie", name: "Eporner Video" } };
  }
  const url = urlFromId(id);
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
  return {
    streams: urls.slice(0, 5).map(u => ({
      name: "CVN xHamster",
      title,
      url: u,
      behaviorHints: {
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
