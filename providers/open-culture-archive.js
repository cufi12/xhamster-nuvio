// CVN Open Culture Archive
// Searches Internet Archive for items whose metadata explicitly identifies
// a Creative Commons or public-domain license. No DRM, paywall, login, or
// access-control bypass is attempted.
const ARCHIVE_SEARCH = "https://archive.org/advancedsearch.php";
const ARCHIVE_METADATA = "https://archive.org/metadata/";
const ALLOWED_LICENSE = /creativecommons\.org\/(licenses|publicdomain)\//i;
const ALLOWED_EXTENSIONS = new Set(["mp4", "m4v", "webm", "ogv", "ogg"]);

function settings() { return globalThis.SCRAPER_SETTINGS || {}; }

async function json(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.json();
}

async function tmdbTitle(tmdbId, mediaType, season, episode, apiKey) {
  let path;
  if (mediaType === "movie") path = "/movie/" + encodeURIComponent(String(tmdbId));
  else if (mediaType === "tv" && season != null && episode != null) {
    path = "/tv/" + encodeURIComponent(String(tmdbId)) + "/season/" +
      encodeURIComponent(String(season)) + "/episode/" + encodeURIComponent(String(episode));
  } else if (mediaType === "tv") path = "/tv/" + encodeURIComponent(String(tmdbId));
  else return "";
  const data = await json("https://api.themoviedb.org/3" + path +
    "?api_key=" + encodeURIComponent(apiKey) + "&language=en-US");
  return String(data.title || data.name || data.original_title || data.original_name || "").trim();
}

function licenseOf(metadata) {
  const raw = String(metadata.licenseurl || metadata.license || metadata.rights || "");
  return ALLOWED_LICENSE.test(raw) ? raw : "";
}

function playableFile(files) {
  if (!Array.isArray(files)) return null;
  const candidates = files.filter(file => {
    const name = String(file.name || "");
    const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
    return ALLOWED_EXTENSIONS.has(ext) && Number(file.size || 0) > 0;
  });
  candidates.sort((a, b) => {
    const score = f => {
      const n = String(f.name || "").toLowerCase();
      return (n.endsWith("_512kb.mp4") ? 4 : 0) + (n.endsWith(".mp4") ? 3 : 0) +
        (n.endsWith(".webm") ? 2 : 0) + (n.endsWith(".ogv") ? 1 : 0);
    };
    return score(b) - score(a);
  });
  return candidates[0] || null;
}

async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    const apiKey = String(settings().tmdbApiKey || "").trim();
    if (!apiKey || !tmdbId) return [];
    const title = await tmdbTitle(tmdbId, mediaType, season, episode, apiKey);
    if (!title) return [];

    const query = 'title:"' + title.replace(/["\\]/g, " ").slice(0, 100) +
      '" AND mediatype:movies';
    const searchUrl = ARCHIVE_SEARCH + "?q=" + encodeURIComponent(query) +
      "&fl[]=identifier&fl[]=title&rows=12&page=1&output=json&sort[]=downloads+desc";
    const search = await json(searchUrl);
    const docs = search && search.response && Array.isArray(search.response.docs)
      ? search.response.docs : [];

    const results = [];
    for (const doc of docs.slice(0, 8)) {
      const identifier = String(doc.identifier || "");
      if (!/^[a-zA-Z0-9._-]+$/.test(identifier)) continue;
      const details = await json(ARCHIVE_METADATA + encodeURIComponent(identifier));
      const meta = details && details.metadata ? details.metadata : {};
      const license = licenseOf(meta);
      if (!license) continue;
      const file = playableFile(details.files);
      if (!file) continue;
      const url = "https://archive.org/download/" + encodeURIComponent(identifier) +
        "/" + encodeURIComponent(String(file.name));
      results.push({
        name: "CVN · Open Culture Archive",
        title: String(doc.title || title) + " · " + String(file.name).split(".").pop().toUpperCase() +
          " · " + (license.includes("publicdomain") ? "Public Domain" : "Creative Commons"),
        url,
        quality: "Archiv"
      });
      if (results.length >= 3) break;
    }
    return results;
  } catch (error) {
    console.warn("[CVN Open Culture Archive] lookup failed:", error && error.message ? error.message : error);
    return [];
  }
}

async function onSettings() {
  return [
    { type: "header", label: "TMDB-Verbindung" },
    {
      type: "text", key: "tmdbApiKey", label: "TMDB API Key",
      placeholder: "TMDB API-Schlüssel", isPassword: true,
      description: "Wird verwendet, um den Film- oder Serientitel zu bestimmen."
    },
    {
      type: "info", label: "Lizenzprüfung",
      description: "Es werden nur Internet-Archive-Einträge mit explizitem Creative-Commons- oder Public-Domain-Lizenzhinweis berücksichtigt. Treffer und Wiedergabe sind nicht garantiert."
    }
  ];
}

module.exports = { getStreams, onSettings };
