// German Dub · aller Welt
// No source is enabled until authorization, German audio (where required),
// regional availability and in-app playback have all been verified.
function getStreams(tmdbId, mediaType, season, episode) {
  const validId = (typeof tmdbId === "string" && tmdbId.trim().length > 0) ||
    (typeof tmdbId === "number" && Number.isFinite(tmdbId));
  const validType = mediaType === "movie" || mediaType === "tv" || mediaType === "series";
  if (!validId || !validType) {
    console.warn("[CVN] German Dub · aller Welt: invalid Nuvio request parameters.");
    return Promise.resolve([]);
  }

  // Intentionally return no results rather than expose unverified sources.
  console.info("[CVN] German Dub · aller Welt: no verified authorized streams are configured.");
  return Promise.resolve([]);
}

module.exports = { getStreams };
