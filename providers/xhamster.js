// Nuvio provider: public xHamster search results for externally supplied movie titles.
// Only public pages and directly exposed media URLs are used. This provider does not
// attempt to bypass login, age checks, CAPTCHAs, DRM, or anti-bot protections.

const TMDB_API_KEY = "4ef0d7355d9ffb5151e987764708ce96";
const SEARCH_BASE = "https://xhamster.com/search/";

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function absoluteUrl(value, base) {
  try {
    return new URL(decodeHtml(value), base).toString();
  } catch (_) {
    return "";
  }
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function readMovieTitle(tmdbId) {
  const url = "https://api.themoviedb.org/3/movie/" +
    encodeURIComponent(String(tmdbId)) +
    "?api_key=" + encodeURIComponent(TMDB_API_KEY) +
    "&language=de-DE";
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("TMDB title lookup failed: " + response.status);
  const data = await response.json();
  return data.title || data.original_title || "";
}

function findVideoPages(html) {
  const links = [];
  const pattern = /(?:href|data-href)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const url = absoluteUrl(match[1], "https://xhamster.com");
    if (!url) continue;
    try {
      const parsed = new URL(url);
      if (
        (parsed.hostname === "xhamster.com" || parsed.hostname.endsWith(".xhamster.com")) &&
        /\/videos?\//i.test(parsed.pathname)
      ) links.push(parsed.origin + parsed.pathname);
    } catch (_) {}
  }
  return unique(links).slice(0, 8);
}

function extractMedia(html, pageUrl) {
  const candidates = [];
  const add = value => {
    const url = absoluteUrl(value, pageUrl);
    if (url && /^https:\/\//i.test(url) && /\.(mp4|m3u8)(?:[?#]|$)/i.test(url)) {
      candidates.push(url);
    }
  };

  const contentUrlPattern = /["'](?:contentUrl|src|file|videoUrl)["']\s*:\s*["']([^"']+)["']/gi;
  let match;
  while ((match = contentUrlPattern.exec(html)) !== null) add(match[1]);

  const tagPattern = /<(?:source|video)[^>]+(?:src|data-src)\s*=\s*["']([^"']+)["']/gi;
  while ((match = tagPattern.exec(html)) !== null) add(match[1]);

  const ogPattern = /<meta[^>]+(?:property|name)=["']og:video(?::url)?["'][^>]+content=["']([^"']+)["']/gi;
  while ((match = ogPattern.exec(html)) !== null) add(match[1]);

  return unique(candidates);
}

function pageTitle(html) {
  const match = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]).replace(/\s*[-|].*$/, "").trim() : "xHamster";
}

async function getStreams(tmdbId, mediaType, season, episode) {
  if (mediaType && mediaType !== "movie") return [];
  if (tmdbId == null) return [];

  try {
    const title = await readMovieTitle(tmdbId);
    if (!title) return [];

    const searchUrl = SEARCH_BASE + encodeURIComponent(title);
    const searchResponse = await fetch(searchUrl, {
      headers: { Accept: "text/html,application/xhtml+xml" }
    });
    if (!searchResponse.ok) return [];

    const searchHtml = await searchResponse.text();
    const pages = findVideoPages(searchHtml);
    const results = [];

    for (const pageUrl of pages) {
      try {
        const pageResponse = await fetch(pageUrl, {
          headers: { Accept: "text/html,application/xhtml+xml" }
        });
        if (!pageResponse.ok) continue;

        const html = await pageResponse.text();
        const mediaUrls = extractMedia(html, pageUrl);
        const label = pageTitle(html);

        for (const mediaUrl of mediaUrls) {
          results.push({
            name: "CVN-xHamster",
            title: label,
            url: mediaUrl,
            quality: "Unknown"
          });
        }
      } catch (_) {
        // Ignore individual unavailable or inaccessible public result pages.
      }
    }

    return results;
  } catch (_) {
    // A blocked, unavailable, or unsupported public endpoint should fail closed.
    return [];
  }
}

module.exports = { getStreams };
