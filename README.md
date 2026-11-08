# CVN Gratis-Katalog für Nuvio

## Nuvio-Plugin-Repository

Repository-URL für Nuvio unter **Einstellungen → Content & Discovery → Plugins → Add Repository**:

https://raw.githubusercontent.com/cufi12/xhamster-nuvio/add-xhamster-provider/manifest.json

Aktivierter Provider:
- **CVN · Open Culture Archive** – sucht im Internet Archive nach Filmdateien, deren Metadaten ausdrücklich eine Creative-Commons- oder Public-Domain-Lizenz nennen.

Der Open-Culture-Provider benötigt einen TMDB API Key in seinen Provider-Einstellungen. Er gibt höchstens drei passende Archivtreffer zurück und prüft vor der Ausgabe die Lizenzmetadaten sowie das Dateiformat. Die Archivsuche kann trotzdem unpassende oder nicht abspielbare Treffer liefern; eine Lizenzangabe in Archivmetadaten ist keine unabhängige Rechtsberatung.

## xHamster-Suche (separates Addon)

Die Apify-Abhängigkeit wurde entfernt. Statt eines Scrapers gibt es jetzt ein eigenständiges, link-basiertes Addon:

**Addon-Manifest für Nuvio/Stremio-kompatible Addons:**
https://cvn-xhamster-catalog.onrender.com/manifest.json

**Render-Service:** https://cvn-xhamster-catalog.onrender.com

Das Addon bietet einen Katalog **„xHamster Suche“**. Eine Suchanfrage erzeugt einen Eintrag, der die passende xHamster-Suchseite extern öffnet. Es liest keine xHamster-Suchergebnisse aus, lädt keine Videos herunter und stellt keine Videostreams bereit. Es ist daher kein integrierter Video-Katalog und keine Wiedergabe innerhalb von Nuvio.

Füge die Manifest-URL in Nuvio über die Funktion zum Hinzufügen eines externen/Stremio-kompatiblen Addons ein, sofern deine Nuvio-Version diese unterstützt. Das normale **Add Repository** oben ist dagegen das Repository für Nuvio-Plugins und nicht die URL dieses separaten Addons.

## Wichtige technische Grenzen

- Nuvio-Plugins liefern Stream-Kandidaten für ausgewählte Filme oder Serien. Sie erstellen keine Live-TV-Kanäle oder eigenen Katalogseiten.
- Live-TV und unabhängige Kataloge benötigen ein separates Stremio-kompatibles Addon.
- Der Open-Culture-Provider ist kein Ersatz für aktuelle Kinofilme, kommerzielle Serien oder einen vollständigen Anime-Katalog.
- Deutsche Studios, German Dub und Hentai German Dub bleiben deaktiviert, bis autorisierte Quellen, Sprachfassung und Wiedergabe zuverlässig geprüft sind.
- Es werden keine Logins, Altersprüfungen, CAPTCHAs, DRM, Paywalls oder Anti-Bot-Schutz umgangen.
- Bitte nutze Inhalte nur im Rahmen der jeweiligen Lizenz und der geltenden Gesetze.
