# CVN Gratis-Katalog für Nuvio

## Nuvio-Plugins

Repository-URL für Nuvio unter **Einstellungen → Content & Discovery → Plugins → Add Repository**:

https://raw.githubusercontent.com/cufi12/xhamster-nuvio/add-xhamster-provider/manifest.json

Aktivierte Provider:
- **xHamster** – bestehender Such-Provider über den verbundenen Apify-Dienst.
- **CVN · Open Culture Archive** – sucht im Internet Archive nach Filmdateien, deren Metadaten ausdrücklich eine Creative-Commons- oder Public-Domain-Lizenz nennen.

Der Open-Culture-Provider benötigt einen TMDB API Key in seinen Provider-Einstellungen. Er gibt höchstens drei passende Archivtreffer zurück und prüft vor der Ausgabe die Lizenzmetadaten sowie das Dateiformat. Die Archivsuche kann trotzdem unpassende oder nicht abspielbare Treffer liefern; eine Lizenzangabe in Archivmetadaten ist keine unabhängige Rechtsberatung.

## Separates xHamster-Katalog-Addon

Für das Durchsuchen des xHamster-Katalogs brauchst du zusätzlich das eigenständige Addon:

https://cvn-xhamster-catalog.onrender.com/manifest.json

Dieses wird im Bereich **Addons** installiert, nicht unter Plugins.

## Wichtige technische Grenzen

- Nuvio-Plugins liefern Stream-Kandidaten für ausgewählte Filme oder Serien. Sie erstellen keine Live-TV-Kanäle oder eigenen Katalogseiten.
- Live-TV und unabhängige Kataloge benötigen ein separates Stremio-kompatibles Addon.
- Der Open-Culture-Provider ist kein Ersatz für aktuelle Kinofilme, kommerzielle Serien oder einen vollständigen Anime-Katalog.
- Deutsche Studios, German Dub und Hentai German Dub bleiben deaktiviert, bis autorisierte Quellen, Sprachfassung und Wiedergabe zuverlässig geprüft sind.
- Es werden keine Logins, Altersprüfungen, CAPTCHAs, DRM, Paywalls oder Anti-Bot-Schutz umgangen.
- Bitte nutze Inhalte nur im Rahmen der jeweiligen Lizenz und der geltenden Gesetze.
