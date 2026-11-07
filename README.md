# CVN Multi-Provider für Nuvio

Community-Projekt mit einer gemeinsamen Nuvio-Plugin-Repository und **einem getrennten Provider-Modul pro unterstützter Plattform**. Katalog-Addon und lokale Stream-Provider bleiben technisch getrennt.

## Architektur

- Das Repository-Manifest `manifest.json` listet alle Provider im Array `scrapers`.
- Jeder Provider besitzt eine eindeutige `id`, einen eigenen Namen und eine eigene JavaScript-Datei unter `providers/`.
- Nuvio lädt die im Manifest aufgeführten Provider und verwaltet sie unabhängig. Ein xHamster-Provider verarbeitet deshalb keine URLs oder Streams anderer Plattformen.
- Neue Plattformen werden als eigenes Modul ergänzt und als zusätzlicher Eintrag im Manifest registriert. Es ist weder nötig noch erwünscht, fremde Plattformlogik in `xhamster.js` einzubauen.
- Gemeinsame Helfer dürfen später in `providers/lib/` liegen; plattformspezifische Suche, Seitenprüfung und Stream-Auflösung bleiben im jeweiligen Provider.

**Aktiv integriert ist derzeit nur xHamster.** Die Multi-Provider-Struktur ist vorbereitet; andere Plattformen werden nicht als verfügbar angezeigt, bevor ein eigener, geprüfter Provider implementiert wurde.

## Bestehender Nuvio-Stream-Provider

Manifest-URL:

`https://raw.githubusercontent.com/cufi12/xhamster-nuvio/add-xhamster-provider/manifest.json`

In Nuvio als **Plugin-Repository** hinzufügen – nicht im Bereich „Addons“:

1. In Nuvio **Einstellungen → Inhalt & Entdeckung → Plugins** öffnen.
2. **Repository hinzufügen** wählen und die Manifest-URL einfügen.
3. Repository aktualisieren und **CVN-xHamster Deutsch** aktivieren.
4. Für die TMDB-Titelsuche den eigenen TMDB Read Access Token (v4) oder alternativ den v3 API-Key in den Provider-Einstellungen eintragen.

Die Menübezeichnungen können je nach App-Version abweichen. Nicht jede Nuvio-Version unterstützt Plugins.

## xHamster-Provider – aktueller Stand

- Provider-Version: **2.1.0**
- Unterstützt die Nuvio-Plugin-Schnittstelle `getStreams(tmdbId, mediaType)`.
- Unterstützt derzeit ausschließlich Filme.
- Bevorzugt öffentlich bereitgestellte HLS-Streams und nutzt MP4 als Fallback.
- Liest öffentliche xHamster-Player-Metadaten; umgeht keine Anmeldung, Altersprüfung, CAPTCHA-, DRM- oder Anti-Bot-Schutzmechanismen.
- Verwendet TMDB-Metadaten zur Titelauflösung.
- Gibt keine Treffer zurück, wenn Metadaten oder passende Stream-Informationen nicht verfügbar sind.

## Deutsche Sprache: nicht verifiziert

Der Provider kann derzeit nicht zuverlässig feststellen, ob ein Treffer deutsche Originalsprache oder deutsche Synchronisation enthält. Der deutsche Such-Host und ein passender Filmtitel sind kein Beleg für eine deutsche Tonspur. Deshalb wird keine bestätigte Inhaltssprache deklariert.

## xHamster-Katalog-Addon

Das Katalog-Addon ist eine eigenständige Stremio-kompatible Komponente unter `addon/`. Es ist nicht das Plugin-Repository und wird in Nuvio unter **Addons** hinzugefügt. Die Addon-URL ist:

`https://cvn-xhamster-catalog.onrender.com/manifest.json`

## Entwicklung und Tests

- Plugin-Manifest: `manifest.json`
- Provider: `providers/xhamster.js`
- Provider-Konvention und Checkliste: `providers/README.md`
- Katalog-Addon: `addon/`
- Vertrags- und Mock-Tests: `tests/validate-provider.mjs`

Änderungen erfolgen auf dem Branch `add-xhamster-provider`. Ein erfolgreicher Syntax-/Mock-Test ersetzt keinen echten Wiedergabetest in Nuvio.

## Sicherheit und Rechte

Dies ist keine offizielle xHamster-Integration. Es gibt keine bestätigte offizielle API-Freigabe oder Partnerschaft. Inhalte werden nicht gespiegelt oder auf unserem Server zwischengespeichert. Nur öffentlich zugängliche Seiten und direkt bereitgestellte Medienadressen werden berücksichtigt, soweit die jeweiligen Zugriffsbedingungen dies erlauben. Keine Umgehung von Zugriffsschutz und keine Weiterverbreitung fremder Inhalte.

**TMDB-Schlüssel:** Ein früher im Quellcode enthaltener Schlüssel gilt als offengelegt und sollte im TMDB-Konto widerrufen/ersetzt werden. Aktuelle Versionen enthalten keinen fest eingebauten Schlüssel; Zugangsdaten werden lokal in Nuvio als Provider-Einstellungen hinterlegt.
