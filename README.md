# CVN Gratis-Katalog für Nuvio

## Nuvio-Plugins

Repository-URL für Nuvio unter **Einstellungen → Content & Discovery → Plugins → Add Repository**:

https://raw.githubusercontent.com/cufi12/xhamster-nuvio/add-xhamster-provider/manifest.json

Aktivierter Provider:
- **CVN · Open Culture Archive** – sucht im Internet Archive nach Filmdateien, deren Metadaten ausdrücklich eine Creative-Commons- oder Public-Domain-Lizenz nennen.

Der Open-Culture-Provider benötigt einen TMDB API Key in seinen Provider-Einstellungen. Er gibt höchstens drei passende Archivtreffer zurück und prüft vor der Ausgabe die Lizenzmetadaten sowie das Dateiformat. Die Archivsuche kann trotzdem unpassende oder nicht abspielbare Treffer liefern; eine Lizenzangabe in Archivmetadaten ist keine unabhängige Rechtsberatung.

## Entfernte Integration

Der xHamster-Provider wurde aus dem aktiven Nuvio-Manifest entfernt, weil sein Backend Apify voraussetzte und ohne funktionierende Apify-Anbindung keine Suchergebnisse lieferte. Es wird kein Ersatz-Scraper als funktionsfähig ausgegeben, solange Quelle, Nutzungsbedingungen und Wiedergabe nicht zuverlässig geprüft sind.

## Wichtige technische Grenzen

- Nuvio-Plugins liefern Stream-Kandidaten für ausgewählte Filme oder Serien. Sie erstellen keine Live-TV-Kanäle oder eigenen Katalogseiten.
- Live-TV und unabhängige Kataloge benötigen ein separates Stremio-kompatibles Addon.
- Der Open-Culture-Provider ist kein Ersatz für aktuelle Kinofilme, kommerzielle Serien oder einen vollständigen Anime-Katalog.
- Deutsche Studios, German Dub und Hentai German Dub bleiben deaktiviert, bis autorisierte Quellen, Sprachfassung und Wiedergabe zuverlässig geprüft sind.
- Es werden keine Logins, Altersprüfungen, CAPTCHAs, DRM, Paywalls oder Anti-Bot-Schutz umgangen.
- Bitte nutze Inhalte nur im Rahmen der jeweiligen Lizenz und der geltenden Gesetze.
