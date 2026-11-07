// Nuvio provider: resolves a movie title from TMDB or an IMDb external ID,
// then searches publicly accessible xHamster pages for matching, directly exposed
// media URLs. It does not bypass login, age checks, CAPTCHAs, DRM, or anti-bot protections.

const SEARCH_BASE = "https://ge.xhamster.com/search/";

function decodeHtml(value) {
  return String(value || "")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\\u0026/gi, "&")
    .replace(/\\u003d/gi, "=")
    .replace(/\\u002f/gi, "/");
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

function getTmdbCredentials() {
  var settings = (typeof globalThis !== "undefined" && globalThis.SCRAPER_SETTINGS) || {};
  return {
    apiKey: String(settings.tmdbApiKey || "").trim(),
    readAccessToken: String(settings.tmdbReadAccessToken || "").trim()
  };
}

function tmdbRequest(url) {
  var credentials = getTmdbCredentials();
  var headers = { Accept: "application/json" };
  if (credentials.readAccessToken) {
    headers.Authorization = "Bearer " + credentials.readAccessToken;
  } else if (credentials.apiKey) {
    url += (url.indexOf("?") >= 0 ? "&" : "?") + "api_key=" + encodeURIComponent(credentials.apiKey);
  } else {
    return Promise.reject(new Error("TMDB API key or Read Access Token is not configured"));
  }

  return fetch(url, { headers: headers }).then(function (response) {
    if (!response.ok) throw new Error("TMDB request failed: " + response.status);
    return response.json();
  });
}

function metadataFromTmdbId(id, mediaType) {
  var endpoint = mediaType === "tv" || mediaType === "series" ? "tv" : "movie";
  var url = "https://api.themoviedb.org/3/" + endpoint + "/" +
    encodeURIComponent(String(id)) + "?language=de-DE";

  return tmdbRequest(url).then(function (data) {
    return {
      title: data.title || data.name || data.original_title || data.original_name || "",
      originalTitle: data.original_title || data.original_name || "",
      year: String(data.release_date || data.first_air_date || "").slice(0, 4)
    };
  });
}

function metadataFromImdbId(imdbId) {
  var findUrl = "https://api.themoviedb.org/3/find/" +
    encodeURIComponent(imdbId) +
    "?external_source=imdb_id&language=de-DE";

  return tmdbRequest(findUrl).then(function (data) {
    var item = (data.movie_results && data.movie_results[0]) ||
      (data.tv_results && data.tv_results[0]);
    if (item) {
      return {
        title: item.title || item.name || item.original_title || item.original_name || "",
        originalTitle: item.original_title || item.original_name || "",
        year: String(item.release_date || item.first_air_date || "").slice(0, 4)
      };
    }
    throw new Error("IMDb ID has no TMDB match");
  }).catch(function () {
    // IMDb fallback: read only public title metadata; do not bypass any access gate.
    return fetch("https://www.imdb.com/title/" + encodeURIComponent(imdbId) + "/", {
      headers: { Accept: "text/html,application/xhtml+xml", "Accept-Language": "de-DE,de;q=0.9,en;q=0.5" }
    }).then(function (response) {
      if (!response.ok) throw new Error("IMDb metadata unavailable: " + response.status);
      return response.text();
    }).then(function (html) {
      var titleMatch =
        html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      var yearMatch = html.match(/(?:19|20)\d{2}/);
      var title = titleMatch ? decodeHtml(titleMatch[1]).replace(/\s*[-|].*$/, "").trim() : "";
      if (!title) throw new Error("IMDb title not found");
      return { title: title, year: yearMatch ? yearMatch[0] : "" };
    });
  });
}

function resolveMovieMetadata(id, mediaType) {
  var rawId = String(id || "");
  var imdbMatch = rawId.match(/tt\d{7,}/i);

  // Known IMDb ID supplied for this movie. This fallback also works if
  // Nuvio passes the IMDb ID directly or TMDB metadata lookup is unavailable.
  if (imdbMatch && imdbMatch[0].toLowerCase() === "tt32873815") {
    return Promise.resolve({
      title: "Barbi in the imperfect world",
      originalTitle: "Barbi in the imperfect world",
      year: "2023"
    });
  }

  if (imdbMatch) return metadataFromImdbId(imdbMatch[0]);
  return metadataFromTmdbId(rawId, mediaType);
}

function findVideoPages(html) {
  var links = [];
  var pattern = /(?:href|data-href)\s*=\s*["']([^"']+)["']/gi;
  var match;

  while ((match = pattern.exec(html)) !== null) {
    var url = absoluteUrl(match[1], "https://ge.xhamster.com/");
    if (isXHamsterVideoPage(url)) {
      links.push(url.split("#")[0].split("?")[0]);
    }
  }
  return unique(links).slice(0, 20);
}

function extractMedia(html, pageUrl) {
  var candidates = [];
  function add(value, quality) {
    if (value && typeof value === "object") {
      quality = value.quality || value.label || quality;
      value = value.url || value.src || value.fallback;
    }
    if (typeof value !== "string") return;
    var url = absoluteUrl(value, pageUrl);
    if (!/^https:\/\//i.test(url) || !/\.(?:mp4|m3u8)(?:[?#]|$)/i.test(url)) return;
    candidates.push({ url: url, quality: String(quality || "") });
  }

  // xHamster publishes player sources in its public initials JSON on some
  // pages. Read only clear-text URLs already present in that response.
  var initialsMatch = html.match(/<script[^>]+id=["']initials-script["'][^>]*>([\s\S]*?)<\/script>/i);
  if (initialsMatch) {
    try {
      var initials = JSON.parse(initialsMatch[1].trim());
      var sources = initials && initials.xplayerSettings && initials.xplayerSettings.sources;
      if (sources && typeof sources === "object") {
        ["hls", "standard"].forEach(function (kind) {
          var group = sources[kind];
          if (!group || typeof group !== "object") return;
          Object.keys(group).forEach(function (quality) {
            var entries = Array.isArray(group[quality]) ? group[quality] : [group[quality]];
            entries.forEach(function (entry) { add(entry, quality); });
          });
        });
      }
    } catch (error) {
      console.log("[CVN-xHamster] Public player metadata was not valid JSON");
    }
  }

  // Fallback: direct media URLs explicitly published in page markup/JSON.
  var patterns = [
    /["'](?:contentUrl|src|file|videoUrl|url)["']\s*:\s*["']([^"']+\.(?:m3u8|mp4)(?:\?[^"']*)?)["']/gi,
    /<(?:source|video)[^>]+(?:src|data-src)\s*=\s*["']([^"']+\.(?:m3u8|mp4)(?:\?[^"']*)?)["']/gi,
    /<meta[^>]+(?:property|name)=["']og:video(?::url)?["'][^>]+content=["']([^"']+\.(?:m3u8|mp4)(?:\?[^"']*)?)["']/gi
  ];
  patterns.forEach(function (pattern) {
    var match;
    while ((match = pattern.exec(html)) !== null) add(match[1]);
  });

  var uniqueByUrl = {};
  candidates.forEach(function (item) { uniqueByUrl[item.url] = item; });
  var result = Object.keys(uniqueByUrl).map(function (url) { return uniqueByUrl[url]; });
  // Prefer HLS, then the highest available resolution; MP4 remains a
  // native-player fallback when the source exposes no HLS playlist.
  result.sort(function (a, b) {
    var ahls = /\.m3u8(?:[?#]|$)/i.test(a.url) ? 1 : 0;
    var bhls = /\.m3u8(?:[?#]|$)/i.test(b.url) ? 1 : 0;
    if (ahls !== bhls) return bhls - ahls;
    var aq = Number((a.quality.match(/\d+/) || [0])[0]);
    var bq = Number((b.quality.match(/\d+/) || [0])[0]);
    return bq - aq;
  });
  return result.slice(0, 5);
}

function pageTitle(html) {
  var match =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return match
    ? decodeHtml(match[1]).replace(/\s*[-|].*$/, "").trim()
    : "";
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleMatches(targetTitle, candidateTitle) {
  var stopWords = {
    "the": true, "in": true, "a": true, "an": true, "of": true,
    "and": true, "der": true, "die": true, "das": true, "ein": true,
    "eine": true, "und": true, "im": true, "am": true
  };
  var normalizedTarget = normalizeTitle(targetTitle);
  var normalizedCandidate = normalizeTitle(candidateTitle);
  var tokens = normalizedTarget.split(" ").filter(function (word) {
    return word.length > 2 && !stopWords[word];
  });
  var candidateTokens = normalizedCandidate.split(" ").filter(Boolean);

  if (!tokens.length || !candidateTokens.length) return false;
  if (normalizedCandidate === normalizedTarget) return true;

  var candidateSet = {};
  candidateTokens.forEach(function (word) { candidateSet[word] = true; });
  var matches = tokens.filter(function (word) {
    return candidateSet[word] === true;
  }).length;

  // Require meaningful overlap instead of accepting any two shared words
  // from a long title. This reduces unrelated results with generic terms.
  var coverage = matches / tokens.length;
  var requiredMatches = Math.min(2, tokens.length);
  return matches >= requiredMatches && coverage >= 0.5;
}

function fetchSearchPages(query) {
  var searchUrl = SEARCH_BASE + encodeURIComponent(query);
  return fetch(searchUrl, {
    headers: { Accept: "text/html,application/xhtml+xml" }
  }).then(function (response) {
    if (!response.ok) return [];
    return response.text();
  }).then(function (html) {
    return html ? findVideoPages(html) : [];
  }).catch(function () {
    return [];
  });
}

function fetchMatchingPage(pageUrl, movieTitle) {
  return fetch(pageUrl, {
    headers: { Accept: "text/html,application/xhtml+xml" }
  }).then(function (response) {
    if (!response.ok) return [];
    return response.text();
  }).then(function (html) {
    if (!html) return [];
    var label = pageTitle(html);
    var expectedTitles = Array.isArray(movieTitle) ? movieTitle : [movieTitle];
    var matchesTitle = expectedTitles.some(function (expected) {
      return titleMatches(expected, label);
    });
    if (!matchesTitle) return [];

    return extractMedia(html, pageUrl).map(function (source) {
      var isHls = /\.m3u8(?:[?#]|$)/i.test(source.url);
      return {
        name: "CVN-xHamster Deutsch",
        title: label + (source.quality ? " · " + source.quality : ""),
        url: source.url,
        quality: source.quality || (isHls ? "HLS" : "MP4"),
        headers: {
          Referer: pageUrl,
          Origin: "https://ge.xhamster.com"
        }
      };
    });
  }).catch(function () {
    return [];
  });
}

function getStreams(tmdbId, mediaType) {
  if (mediaType && mediaType !== "movie") return Promise.resolve([]);
  if (tmdbId == null) return Promise.resolve([]);

  return resolveMovieMetadata(tmdbId, mediaType)
    .then(function (metadata) {
      if (!metadata || !metadata.title) return [];

      // Nuvio supplies a TMDB ID (not the catalog IMDb ID). Search both the
      // localized and original TMDB titles, with and without the release year.
      var titles = unique([metadata.title, metadata.originalTitle]);

      // Known alternate xHamster title supplied by the user for this film.
      var normalizedTitle = String(metadata.title || "").toLowerCase()
        .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
      var knownPages = [];
      if (normalizedTitle === "barbi in the imperfect world") {
        titles.push("Barbys Erotic World");
        knownPages.push("https://ge.xhamster.com/videos/barbys-erotic-world-9853837");
      }

      var queries = [];
      titles.forEach(function (title) {
        queries.push(title);
        if (metadata.year) queries.push(title + " " + metadata.year);
      });

      console.log("[CVN-xHamster] TMDB " + tmdbId + " resolved to: " + metadata.title + (metadata.year ? " (" + metadata.year + ")" : ""));
      return Promise.all(queries.map(fetchSearchPages))
        .then(function (groups) {
          var pages = unique([].concat.apply([], groups).concat(knownPages)).slice(0, 30);
          console.log("[CVN-xHamster] Search pages found: " + pages.length);
          return Promise.all(pages.map(function (pageUrl) {
            return fetchMatchingPage(pageUrl, titles);
          }));
        })
        .then(function (groups) {
          var streams = groups.reduce(function (all, group) {
            return all.concat(group);
          }, []);
          console.log("[CVN-xHamster] Matching direct streams: " + streams.length);
          return streams;
        });
    })
    .catch(function () {
      // No metadata, blocked page, or incompatible source: return no streams.
      return [];
    });
}

function onSettings() {
  return [
    { type: "header", label: "TMDB-Konfiguration" },
    {
      type: "text",
      key: "tmdbReadAccessToken",
      label: "TMDB Read Access Token (v4)",
      placeholder: "TMDB Bearer-Token einfügen",
      description: "Bevorzugte Authentifizierung. Wird lokal in Nuvio gespeichert, nicht im Repository.",
      isPassword: true
    },
    {
      type: "text",
      key: "tmdbApiKey",
      label: "TMDB API Key (v3, optional)",
      placeholder: "Alternativ den v3 API-Key eingeben",
      description: "Nur als Rückfall, wenn kein v4 Read Access Token eingetragen ist.",
      isPassword: true
    },
    {
      type: "info",
      label: "Der v4 Read Access Token wird bevorzugt. Ohne v4- oder v3-Schlüssel kann der Provider keine TMDB-Metadaten laden."
    }
  ];
}

module.exports = { getStreams: getStreams, onSettings: onSettings };
