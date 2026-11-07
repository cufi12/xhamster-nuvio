// Nuvio provider adapter for the existing xHamster/Apify service.
// It resolves the selected TMDB movie title, searches the backend catalog,
// and returns only direct media streams supplied by the backend.

const BACKEND = "https://cvn-xhamster-catalog.onrender.com";

function getSettings() {
  return globalThis.SCRAPER_SETTINGS || {};
}

function validHttpUrl(value) {
  if (typeof value !== "string") return false;
  return /^https?:\/\//i.test(value);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.json();
}

async function getMovieTitle(tmdbId, apiKey) {
  const url = "https://api.themoviedb.org/3/movie/" +
    encodeURIComponent(String(tmdbId)) +
    "?api_key=" + encodeURIComponent(apiKey) +
    "&language=de-DE";
  const data = await fetchJson(url);
  return String(data.title || data.original_title || "").trim();
}

async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    if (!tmdbId || mediaType !== "movie") return [];

    const apiKey = String(getSettings().tmdbApiKey || "").trim();
    if (!apiKey) {
      console.warn("[xHamster] TMDB API key is missing in provider settings");
      return [];
    }

    const title = await getMovieTitle(tmdbId, apiKey);
    if (!title) return [];

    const catalogUrl = BACKEND + "/catalog/movie/xh_search/search=" +
      encodeURIComponent(title) + ".json";
    const catalog = await fetchJson(catalogUrl);
    const metas = Array.isArray(catalog.metas) ? catalog.metas : [];

    const results = [];
    for (const meta of metas.slice(0, 5)) {
      if (!meta || typeof meta.id !== "string") continue;
      const streamUrl = BACKEND + "/stream/movie/" +
        encodeURIComponent(meta.id) + ".json";
      const payload = await fetchJson(streamUrl);
      const streams = Array.isArray(payload.streams) ? payload.streams : [];

      for (const stream of streams) {
        if (!stream || !validHttpUrl(stream.url)) continue;
        results.push({
          name: "xHamster",
          title: String(stream.title || meta.name || title),
          url: stream.url,
          quality: stream.quality || undefined,
          headers: stream.behaviorHints?.proxyHeaders || stream.headers || undefined
        });
      }
    }

    return results;
  } catch (error) {
    console.error("[xHamster] Provider error:", error && error.message ? error.message : error);
    return [];
  }
}

async function onSettings() {
  return [
    { type: "header", label: "TMDB-Verbindung" },
    {
      type: "text",
      key: "tmdbApiKey",
      label: "TMDB API Key",
      placeholder: "TMDB API-Schlüssel einfügen",
      description: "Wird benötigt, um die TMDB-ID in einen Filmtitel für die xHamster-Suche umzuwandeln.",
      isPassword: true
    },
    {
      type: "info",
      label: "Hinweis",
      description: "Der Provider unterstützt derzeit nur Filme. Die Suche und Stream-Prüfung laufen über den verbundenen xHamster-Backend-Dienst."
    }
  ];
}

module.exports = { getStreams, onSettings };
