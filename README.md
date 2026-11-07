# CVN Gratis-Katalog für Nuvio

Dieses Repository ist für die **Nuvio-Provider-Liste** bestimmt, nicht für Stremio-Add-ons.

## Installation

Manifest-URL:
https://raw.githubusercontent.com/cufi12/xhamster-nuvio/add-xhamster-provider/manifest.json

## Provider

### xHamster

Der Eintrag **xHamster** ist ein eigener Nuvio-Provider (kein Katalog-Addon in Nuvio).

- Unterstützt derzeit nur Filme.
- Nuvio übergibt eine TMDB-ID; der Provider löst den Filmtitel über die TMDB-API auf.
- In den Einstellungen des Providers muss dafür ein eigener TMDB API Key hinterlegt werden.
- Die Suche und Prüfung direkter Medienstreams läuft über den bestehenden Apify-Backend-Dienst.
- Der Apify-Token bleibt ausschließlich als serverseitige Render-Umgebungsvariable gespeichert und wird nicht an Nuvio ausgeliefert.
- Es werden nur vom Backend als direkte Medien-URLs bestätigte Streams zurückgegeben. Keine Umgehung von Logins, Altersprüfungen, CAPTCHAs, DRM, Paywalls oder Anti-Bot-Schutz.

**Wichtig:** Die technische Erreichbarkeit oder ein direkter Stream-Nachweis ist kein Nachweis für Verbreitungsrechte. Bitte nur Inhalte nutzen, für die du zur Wiedergabe berechtigt bist. Ein echter Nuvio-Provider- und Wiedergabetest steht noch aus.

### Weitere geplante Kategorien

1. **Deutsche Studios** – deutsche Studios und Produktionen.
2. **German Dub · Aller Welt** – internationale Filme mit tatsächlich deutscher Synchron-Tonspur.
3. **Hentai · German Dub** – japanische Hentai-Filme und Serien mit tatsächlich deutscher Synchronisation.

Diese drei Provider sind weiterhin deaktiviert, bis kostenlose und autorisierte Quellen sowie die Wiedergabe pro Titel technisch geprüft sind.

## Technischer Status

Das Manifest entspricht dem Nuvio-Plugin-Repositorymodell (PluginManifest) mit name, version und einem scrapers-Array. Nuvio ruft getStreams(tmdbId, mediaType, season, episode) auf und erwartet ein Array von Stream-Objekten (title, url, optional name, quality, language, headers). Die Provider laufen lokal in Nuvios JavaScript-Runtime; der xHamster-Provider greift für Suche und Stream-Prüfung auf den verbundenen Backend-Dienst zu.

Der xHamster-Eintrag ist im Manifest aktiviert, benötigt aber einen TMDB API Key in seinen Provider-Einstellungen. Die drei anderen Provider-Dateien sind Platzhalter und liefern keine Streams; sie bleiben deaktiviert. Ein lokaler Vertragstest ersetzt weder den Nuvio-Provider-Tester noch einen echten Wiedergabetest.

## Tests

Der Provider-Vertrag kann lokal mit Node.js geprüft werden:

    node tests/provider-contract.test.js

Der Test prüft Manifest, Exporte, Einstellungen und sichere Eingabevalidierung. Er ist **kein** End-to-End-Test gegen TMDB, Apify oder den Nuvio-Player.
