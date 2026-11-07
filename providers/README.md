# Provider-Module: Integrationsvertrag

Jede Plattform bekommt eine eigene Datei und einen eigenen Manifest-Eintrag. Niemals fremde Domains oder plattformspezifische Extraktionsregeln in `xhamster.js` ergänzen.

## Nuvio-Vertrag

Ein registrierter JavaScript-Provider exportiert:

- `getStreams(tmdbId, mediaType)`: gibt eine Liste kompatibler Stream-Objekte zurück; bei nicht unterstützten Typen oder fehlenden Daten eine leere Liste.
- `onSettings()`: gibt optional ein Schema für plattformspezifische Einstellungen zurück.

## Checkliste für einen neuen Provider

1. Plattform und erlaubte Integrationsmethode prüfen; bevorzugt offizielle API oder ausdrücklich erlaubtes Embed.
2. Neue Datei unter `providers/<platform>.js` anlegen.
3. Eigene Domains, Suchlogik, ID-Präfixe und Extraktion strikt auf diese Plattform begrenzen.
4. Fehler, leere Ergebnisse und nicht unterstützte Medientypen sicher behandeln.
5. Keine Anmeldung, Altersprüfung, CAPTCHA, DRM, Geoblocking, signierte URLs oder Anti-Bot-Schutzmaßnahmen umgehen.
6. Keine fremden Streams proxyen, spiegeln oder weiterverbreiten.
7. Eigenen eindeutigen Eintrag zu `manifest.json` → `scrapers` hinzufügen.
8. Mock-Tests für Erfolg, leere Ergebnisse, falsche IDs und nicht unterstützte Medientypen ergänzen.
9. Erst nach realem Nuvio-Test als unterstützt dokumentieren.

## Status

Derzeit ist nur `xhamster` registriert. Diese Datei ist die verbindliche Erweiterungsrichtlinie, kein aktiver Provider und kein Hinweis darauf, dass weitere Plattformen bereits funktionieren.
