# Provider-Module: Integrationsvertrag

Jede Plattform bekommt eine eigene Datei und einen eigenen Manifest-Eintrag. Plattformfremde Domains und Extraktionsregeln bleiben getrennt.

## Nuvio-Vertrag

Ein registrierter JavaScript-Provider exportiert:

- `getStreams(tmdbId, mediaType)`: gibt kompatible Stream-Objekte zurück; bei nicht unterstützten Typen oder fehlenden Daten eine leere Liste.
- `onSettings()`: gibt optional ein Schema für plattformspezifische Einstellungen zurück.

## Tatsächlich aktiver Stand

Das Repository-Manifest (`manifest.json`) aktiviert derzeit **CVN · Open Culture Archive**. Die Einträge für deutsche Studios, German Dub und Anime/German Dub bleiben deaktiviert, bis autorisierte Quellen, tatsächliche Audio-Sprachdaten und die Wiedergabe geprüft sind.

Der Eintrag `providers/xhamster.js` ist derzeit **nicht im Repository-Manifest registriert**. Er darf nicht als funktionsfähiger Provider beworben oder aktiviert werden, solange der Backend-Vertrag nicht zu seiner Stream-Erwartung passt.

## Separates xHamster-Addon

Das aktive Addon liegt unter `addon/` und wird unabhängig als Stremio-kompatibles Addon betrieben. Es erzeugt externe Suchlinks und liefert `externalUrl`; es liest keine Suchergebnisse aus und stellt keine direkten Medienstreams bereit.

Daraus folgt:

- Es gibt aktuell keine HLS- oder MP4-Wiedergabe über dieses Addon.
- Laufzeit-, Trailer-, Clip-, Studio- und Audio-Sprachfilter werden in diesem Link-only-Addon nicht ausgeführt.
- Metadaten oder Titel sind kein Beleg für eine tatsächlich vorhandene deutsche Audiospur.
- Deutsche Studios, German Dub und Anime-Kataloge bleiben deaktiviert, bis Quelle, Lizenz/Autorisierung, tatsächliche Audiospur und Wiedergabe nachgewiesen sind.
- iXXX bleibt entfernt, solange die Quelle nicht verifiziert ist.

## Checkliste für einen künftigen Provider

1. Plattform und erlaubte Integrationsmethode prüfen; offizielle API oder ausdrücklich erlaubtes Embed bevorzugen.
2. Neue Datei unter `providers/<platform>.js` anlegen.
3. Eigene Domains, Suchlogik und ID-Präfixe strikt auf diese Plattform begrenzen.
4. Fehler, leere Ergebnisse und nicht unterstützte Medientypen sicher behandeln.
5. Keine Anmeldung, Altersprüfung, CAPTCHA, DRM, Geoblocking, signierte URLs oder Anti-Bot-Schutzmaßnahmen umgehen.
6. Keine fremden Streams proxyen, spiegeln oder weiterverbreiten.
7. Eindeutigen Eintrag in `manifest.json` ergänzen.
8. Mock-Tests für Erfolg, leere Ergebnisse, falsche IDs und nicht unterstützte Medientypen ergänzen.
9. Sprachfilter nur anhand tatsächlicher Audio-Metadaten aktivieren, nicht anhand von Titel oder Beschreibung.
10. Erst nach einem realen Nuvio-Test als unterstützt dokumentieren.
