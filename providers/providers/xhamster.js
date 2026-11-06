function getStreams(tmdbId, mediaType, season, episode) {
  console.log("[xHamster] Suche gestartet");

  return fetch(
    "https://xhamster.com/search/" + encodeURIComponent(String(tmdbId))
  )
    .then(function(response) {
      return response.text();
    })
    .then(function(html) {
      console.log("[xHamster] Suchseite geladen");
      return [];
    })
    .catch(function(error) {
      console.log("[xHamster] Fehler:", error);
      return [];
    });
}

module.exports = { getStreams };
