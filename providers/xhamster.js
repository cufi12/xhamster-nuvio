// Nuvio provider: searches public xHamster pages for an externally supplied movie title.
// It only returns directly exposed HTTPS MP4/HLS URLs. It does not bypass login,
// age checks, CAPTCHAs, DRM, or anti-bot protections.

const TMDB_API_KEY = "4ef0d7355d9ffb5151e987764708ce96";
const SEARCH_BASE = "https://xhamster.com/search/";

function decodeHtml(value) {
  return String(value || "")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function absoluteUrl(value, base) {
  var raw = decodeHtml(value).trim();
  if (!raw) return "";
  if (/^https:\/\//i.test(raw)) return raw;
  if (/^\/\//.test(raw)) return "https:" + raw;

  var originMatch = String(base || "").match(/^(https?:\/\/[^/]+)/i);
  if (!originMatch) return "";
  if (raw.charAt(0) === "/") return originMatch[1] + raw;

  var basePath = String(base).replace(/[?#].*$/, "");
  basePath = basePath.slice(0, basePath.lastIndexOf("/") + 1);
  return basePath + raw;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isXHamsterVideoPage(url) {
  return /^https:\/\/(?:[a-z0-9-]+\.)*xhamster\.com\/videos?\//i.test(url);
}

function readMovieTitle(tmdbId) {
  var url = "https://api.themoviedb.org/3/movie/" +
    encodeURIComponent(String(tmdbId)) +
    "?api_key=" + encodeURIComponent(TMDB_API_KEY) +
    "&language=de-DE";

  return fetch(url, { headers: { Accept: "application/json" } })
    .then(function (response) {
      if (!response.ok) throw new Error("TMDB title lookup failed: " + response.status);
      return response.json();
    })
    .then(function (data) {
      return data.title || data.original_title || "";
    });
}

function findVideoPages(html) {
  var links = [];
  var pattern = /(?:href|data-href)\s*=\s*["']([^"']+)["']/gi;
  var match;

  while ((match = pattern.exec(html)) !== null) {
    var url = absoluteUrl(match[1], "https://xhamster.com/");
    if (isXHamsterVideoPage(url)) {
      links.push(url.split("#")[0].split("?")[0]);
    }
  }
  return unique(links).slice(0, 8);
}

function extractMedia(html, pageUrl) {
  var candidates = [];
  var patterns = [
    /["'](?:contentUrl|src|file|videoUrl)["']\s*:\s*["']([^"']+)["']/gi,
    /<(?:source|video)[^>]+(?:src|data-src)\s*=\s*["']([^"']+)["']/gi,
    /<meta[^>]+(?:property|name)=["']og:video(?::url)?["'][^>]+content=["']([^"']+)["']/gi
  ];

  patterns.forEach(function (pattern) {
    var match;
    while ((match = pattern.exec(html)) !== null) {
      var url = absoluteUrl(match[1], pageUrl);
      if (/^https:\/\//i.test(url) && /\.(?:mp4|m3u8)(?:[?#]|$)/i.test(url)) {
        candidates.push(url);
      }
    }
  });

  return unique(candidates);
}

function pageTitle(html) {
  var match =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return match
    ? decodeHtml(match[1]).replace(/\s*[-|].*$/, "").trim()
    : "xHamster";
}

function getStreams(tmdbId, mediaType) {
  if (mediaType && mediaType !== "movie") return Promise.resolve([]);
  if (tmdbId == null) return Promise.resolve([]);

  return readMovieTitle(tmdbId)
    .then(function (title) {
      if (!title) return [];
      var searchUrl = SEARCH_BASE + encodeURIComponent(title);

      return fetch(searchUrl, {
        headers: { Accept: "text/html,application/xhtml+xml" }
      }).then(function (response) {
        if (!response.ok) return [];
        return response.text();
      }).then(function (searchHtml) {
        if (!searchHtml) return [];
        var pages = findVideoPages(searchHtml);

        return Promise.all(pages.map(function (pageUrl) {
          return fetch(pageUrl, {
            headers: { Accept: "text/html,application/xhtml+xml" }
          }).then(function (response) {
            if (!response.ok) return [];
            return response.text();
          }).then(function (html) {
            if (!html) return [];
            var label = pageTitle(html);
            return extractMedia(html, pageUrl).map(function (mediaUrl) {
              return {
                name: "CVN-xHamster",
                title: label,
                url: mediaUrl,
                quality: "Unknown"
              };
            });
          }).catch(function () {
            return [];
          });
        })).then(function (groups) {
          return groups.reduce(function (all, group) {
            return all.concat(group);
          }, []);
        });
      });
    })
    .catch(function () {
      // Fail closed when TMDB or xHamster is unavailable, blocked, or incompatible.
      return [];
    });
}

module.exports = { getStreams: getStreams };
